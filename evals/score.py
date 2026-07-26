#!/usr/bin/env python3
"""
evals/score.py — deterministic scorer for Assumptions ledger runs.

Grades a produced-findings JSON file (see evals/schema.md) against the
corresponding expected-findings JSON file, computes weighted recall and
precision per evals/rubric.md, and applies gate checks suitable for CI.

This script does NOT invoke an LLM and does NOT parse Markdown ledgers.
Converting a produced Markdown ledger into evals/produced/<fixture>.json
is a grading step that still requires human or LLM judgment to match
findings — see "Matching is not fully automatic" in evals/schema.md.

Usage:
    python3 evals/score.py evals/produced/duplicate-checkout.json
    python3 evals/score.py evals/produced/*.json --gate
    python3 evals/score.py evals/produced/*.json --gate --min-recall 0.8

Exit codes:
    0  all gates passed (or --gate not given)
    1  a gate failed (missed required finding, or recall below --min-recall)
    2  usage / file error
"""

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EXPECTED_DIR = REPO_ROOT / "evals" / "expected"


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        print(f"error: file not found: {path}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as e:
        print(f"error: invalid JSON in {path}: {e}", file=sys.stderr)
        sys.exit(2)


def score_fixture(produced_path: Path) -> dict:
    produced = load_json(produced_path)
    fixture = produced.get("fixture")
    if not fixture:
        print(f"error: {produced_path} missing 'fixture' field", file=sys.stderr)
        sys.exit(2)

    expected_path = EXPECTED_DIR / f"{fixture}.json"
    expected = load_json(expected_path)

    expected_findings = {f["id"]: f for f in expected.get("findings", [])}
    produced_findings = produced.get("findings", [])

    hits, partials, misses = [], [], []
    violations = []

    matched_ids = {
        pf.get("matches") for pf in produced_findings if pf.get("matches")
    }

    for fid, ef in expected_findings.items():
        if fid not in matched_ids:
            misses.append(fid)
            continue

        pf = next(p for p in produced_findings if p.get("matches") == fid)

        status_ok = pf.get("status") in ef.get("status_allowed", [])
        confidence_ok = pf.get("confidence") in ef.get("confidence_allowed", [])
        evidence_files = pf.get("evidence_files", [])
        evidence_ok = any(
            ref in evidence_files for ref in ef.get("evidence_must_reference", [])
        )

        if status_ok and confidence_ok and evidence_ok:
            hits.append(fid)
        else:
            partials.append(fid)
            reasons = []
            if not status_ok:
                reasons.append(
                    f"status '{pf.get('status')}' not in {ef.get('status_allowed')}"
                )
            if not confidence_ok:
                reasons.append(
                    f"confidence '{pf.get('confidence')}' not in {ef.get('confidence_allowed')}"
                )
            if not evidence_ok:
                reasons.append(
                    f"no evidence_files match {ef.get('evidence_must_reference')}"
                )
            violations.append(
                {"finding": fid, "type": "mislabeled", "detail": "; ".join(reasons)}
            )

    # Prohibited claims: any produced finding whose evidence concept and
    # status+confidence combination matches a prohibited pattern.
    for pc in expected.get("prohibited_claims", []):
        bad = pc["must_not_be"]
        for pf in produced_findings:
            if (
                pf.get("status") == bad.get("status")
                and pf.get("confidence") == bad.get("confidence")
                and pf.get("matches") is None
            ):
                # Heuristic only: a finding with no expected match that
                # happens to carry the exact prohibited status+confidence
                # combo is flagged for human review, not auto-failed,
                # since concept matching isn't attempted here.
                violations.append(
                    {
                        "finding": pf.get("matches") or "(unmatched)",
                        "type": "possible_prohibited_claim",
                        "detail": f"status/confidence matches a prohibited pattern for concept '{pc['concept']}': {pc['reason']}",
                    }
                )

    required_misses = [
        fid for fid in misses if expected_findings[fid].get("required")
    ]

    n = len(hits) + len(partials) + len(misses)
    weighted_recall = (
        (len(hits) + 0.5 * len(partials)) / n if n else 0.0
    )

    total_reported = len(produced_findings)
    unsupported = sum(
        1
        for pf in produced_findings
        if pf.get("matches")
        and pf.get("matches") in [v["finding"] for v in violations]
    )
    precision = (
        (total_reported - unsupported) / total_reported if total_reported else 1.0
    )

    # Review-plan check: only applies to oversized-scope fixtures that
    # declare review_plan_required in evals/expected/<fixture>.json.
    # The producer records what it actually selected/excluded in
    # evals/produced/<fixture>.json's "review_plan_selected" /
    # "review_plan_excluded" arrays (file paths, or path globs matching
    # the expected exclude categories). Fixtures with no such
    # requirement are unaffected — this block is a no-op for them.
    review_plan_ok = True
    review_plan_notes = []
    if expected.get("review_plan_required"):
        must_select = set(expected.get("review_plan_must_select", []))
        selected = set(produced.get("review_plan_selected", []))
        missing_selects = must_select - selected
        if missing_selects:
            review_plan_ok = False
            review_plan_notes.append(
                f"review plan did not select required high-risk file(s): {sorted(missing_selects)}"
            )
        if not produced.get("review_plan_excluded"):
            review_plan_ok = False
            review_plan_notes.append(
                "no review_plan_excluded list provided — an oversized-scope run "
                "must explicitly name what it excluded, not silently omit it"
            )
        if "review_plan_selected" not in produced and "review_plan_excluded" not in produced:
            review_plan_notes.append(
                "this fixture requires a review plan but the produced JSON has no "
                "review_plan_selected/review_plan_excluded fields — grade the plan "
                "manually against EXPECTED_FINDINGS.md and fill these in"
            )

    return {
        "fixture": fixture,
        "run_label": produced.get("run_label", "(unlabeled)"),
        "hits": hits,
        "partials": partials,
        "misses": misses,
        "required_misses": required_misses,
        "violations": violations,
        "weighted_recall": round(weighted_recall, 3),
        "precision": round(precision, 3),
        "review_plan_required": bool(expected.get("review_plan_required")),
        "review_plan_ok": review_plan_ok,
        "review_plan_notes": review_plan_notes,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("produced_files", nargs="+", type=Path)
    parser.add_argument(
        "--gate",
        action="store_true",
        help="exit non-zero if any required finding is missed or recall falls below --min-recall",
    )
    parser.add_argument(
        "--min-recall",
        type=float,
        default=1.0,
        help="minimum weighted_recall per fixture when --gate is set (default: 1.0)",
    )
    args = parser.parse_args()

    results = [score_fixture(p) for p in args.produced_files]
    gate_failed = False

    for r in results:
        print(f"\n=== {r['fixture']} ({r['run_label']}) ===")
        print(f"  weighted_recall: {r['weighted_recall']}   precision: {r['precision']}")
        print(f"  hits: {len(r['hits'])}  partials: {len(r['partials'])}  misses: {len(r['misses'])}")
        if r["misses"]:
            print(f"  missed: {r['misses']}")
        if r["required_misses"]:
            print(f"  ⚠ REQUIRED MISSES: {r['required_misses']}")
        if r["violations"]:
            for v in r["violations"]:
                print(f"  ⚠ {v['type']} on '{v['finding']}': {v['detail']}")
        if r["review_plan_required"]:
            status = "OK" if r["review_plan_ok"] else "FAILED"
            print(f"  review plan: {status}")
            for note in r["review_plan_notes"]:
                print(f"    ⚠ {note}")

        if args.gate:
            if r["required_misses"]:
                gate_failed = True
            if r["weighted_recall"] < args.min_recall:
                gate_failed = True
            if r["review_plan_required"] and not r["review_plan_ok"]:
                gate_failed = True

    if args.gate:
        print(f"\n{'GATE FAILED' if gate_failed else 'GATE PASSED'}")
        sys.exit(1 if gate_failed else 0)


if __name__ == "__main__":
    main()
