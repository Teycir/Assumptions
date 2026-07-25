# Assumption Ledger

> A Claude Code skill that turns a code change into an evidence-backed ledger
> of hidden assumptions, failure modes, and falsification tests.

**Find what your code assumes before production proves it wrong.**

Most production failures are not caused by obviously broken code.

They happen because a change silently assumes something will remain true:

- "This request is only processed once."
- "The migration deploys before the worker."
- "That API field is never absent."
- "Events always arrive in order."
- "This record belongs to the current tenant."
- "A user cannot click the button twice."

Assumption Ledger asks one question:

> **What must be true for this change not to break in production?**

It then produces a reviewable artifact:

- the assumption
- evidence in the repository
- what breaks if it is false
- safeguards already present
- a test or procedure to falsify it
- a recommended control
- confidence and release priority

## Example

```
/assumptions
```

```
| Priority | Assumption | If false | Falsification test |
|---|---|---|---|
| P0 | A payment request is processed once. | A retry charges the customer twice. | Replay the same request concurrently. |
| P1 | New workers never see the old schema. | Rolling deploy causes worker failures. | Run new code against the old schema. |
```

## Installation

Copy this repository into your Claude Code skills directory, or reference
`SKILL.md` directly from your agent configuration. No build step is
required.

## Usage

```
/assumptions
/assumptions src/billing/create-refund.ts
/assumptions --deploy "Add a nullable organization_id column, backfill it, then require it"
/assumptions --concurrency "Can two people redeem the same invite?"
/assumptions --failure "What happens if Stripe times out after charging the customer?"
/assumptions --tests src/billing/create-refund.ts
/assumptions --compact
```

See `SKILL.md` for the full list of modes and the required output format.

## What this is not

- Not a generic AI code reviewer
- Not a static analyzer
- Not a list of imaginary edge cases
- Not an autonomous code modifier

Every finding should be grounded in repository evidence and include a way to
prove, protect, or falsify the underlying assumption.

## Repository layout

```
Assumptions/
├── SKILL.md          Core skill definition and output contract
├── README.md         This file
├── LICENSE            MIT license
├── CONTRIBUTING.md    How to add examples, fixtures, and eval cases
├── examples/          Sample ledgers produced against real-world-style diffs
├── fixtures/          Small repos with known, documented hidden assumptions
├── evals/             Benchmark cases and grading rubric
└── assets/            Demo media
```

## Privacy and cost

Assumption Ledger is a local, open-source skill. It has no hosted backend,
telemetry, database, or account requirement. You use it with your own
Claude Code or compatible agent environment.

## License

MIT — see `LICENSE`.
