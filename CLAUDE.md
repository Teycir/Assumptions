# Working in this repository

## When to run the Assumptions skill

Before committing changes to application code, migrations, authentication,
payments, queues, webhooks, or configuration, run the Assumptions skill
against the staged diff first:

    Use Assumptions to review the current diff.

This is guidance, not an enforced gate — nothing here blocks a commit.
It exists so the review happens by default instead of only when asked.

Skip it for docs-only, comment-only, or formatting-only changes.

## Optional: local pre-commit reminder

`scripts/assumptions-precommit` is an opt-in script that reminds you to
run Assumptions before a commit if you haven't recently. It is not
installed automatically. See its header comment for setup.
