# Expected findings: benign-refactor

This fixture tests negative false-positive discipline. A pure, synchronous, side-effect-free helper function with comprehensive unit tests should yield **0 reportable defects**.

## Expected findings

* **No P0/P1/P2/P3 defects.** The diff is a pure refactor of string formatting logic with no network calls, database access, concurrency implications, or state mutation.

## Non-findings / Prohibited Claims

- **Do NOT fabricate risk:** Do NOT invent database, deployment, or auth failure modes for pure memory-bound utility logic.
