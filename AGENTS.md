# Agent instructions for this repository

## Assumptions skill

Before committing non-trivial code changes (application logic, migrations,
auth, payments, queues, webhooks, config), invoke the Assumptions skill on
the current diff:

    Use Assumptions to review the current diff.

Skip this for docs-only or formatting-only changes.

This is a repository convention, not a technical gate — no tool here
blocks a commit. If your host supports command hooks and you want an
actual local speed bump, see `scripts/assumptions-precommit`.
