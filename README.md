# Assumptions

> An agent-agnostic coding skill that turns a code change into an
> evidence-backed ledger of hidden assumptions, failure modes, and
> falsification tests.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Works with Claude Code](https://img.shields.io/badge/Works%20with-Claude%20Code-orange.svg)](#installation)
[![Agent Agnostic](https://img.shields.io/badge/Agent-Agnostic-blueviolet.svg)](#installation)
[![No Build Step](https://img.shields.io/badge/Setup-No%20Build%20Step-brightgreen.svg)](#installation)
[![No Cloud Required](https://img.shields.io/badge/No%20Cloud-100%25%20Local-green.svg)](#privacy-and-cost)

**Find what your code assumes before production proves it wrong.**

One command turns a diff into a reviewable table: every hidden assumption,
the evidence behind it, what breaks if it's wrong, and the test that proves
it one way or the other — in about the time it takes to read the PR.

Most production failures are not caused by obviously broken code.

They happen because a change silently assumes something will remain true:

- "This request is only processed once."
- "The migration deploys before the worker."
- "That API field is never absent."
- "Events always arrive in order."
- "This record belongs to the current tenant."
- "A user cannot click the button twice."

Assumptions asks one question:

> **What must be true for this change not to break in production?**

It then produces a reviewable artifact:

- the assumption
- evidence in the repository
- what breaks if it is false
- safeguards already present
- a test or procedure to falsify it
- a recommended control
- confidence and release priority

---

## Why not just ask your AI assistant to review this?

You can ask any coding agent "what could go wrong with this diff?" and get
an answer. The problem is that a free-form answer is easy to skim and hard
to act on — and there's no standard forcing it to show its work.

| | Generic "review this" prompt | Assumptions |
| :--- | :--- | :--- |
| **Output shape** | Prose, varies every run | Fixed table: Assumption, Evidence, If false, Protection, Falsification test, Action, Confidence |
| **Evidence** | Often asserted, not shown | Required — every entry cites the exact repository evidence, or is downgraded to `Unknown` |
| **Severity** | "This seems risky" | Explicit P0–P3 priority, argued from consequence, not tone |
| **Confidence** | Implied by wording | Explicit label: Verified / Likely / Unknown / Assumption to verify |
| **Actionability** | You still have to invent a test | Every finding ships with a concrete falsification test or verification step |
| **False positives** | Generic "edge case" lists pad the output | Nothing is reported without evidence — an unclear case is labeled `Unknown`, not flagged as a bug |
| **Consistency across reviewers** | Depends on how the prompt was phrased | Same ledger format every time, so PRs are comparable across the team |

The skill doesn't replace your agent's judgment — it constrains it to a
format that's fast to review and hard to hand-wave through. See the
[Example](#example) below for a real ledger, not a description of one.

---

## 🎯 Use Cases

| Scenario | What happens without Assumptions | What Assumptions does |
| :--- | :--- | :--- |
| **Reviewing a payment or checkout PR** | The reviewer eyeballs the diff for obvious bugs; idempotency and retry behavior go unchecked unless someone happens to ask | `/assumptions-scan` surfaces "is this request processed exactly once?" as a P0 finding, with evidence, a concrete failure mode, and a falsification test to run before merge |
| **Shipping a schema migration alongside app code** | The migration and the code that reads the new column ship together and "probably" deploy in the right order | `/assumptions-scan --deploy` checks for NOT NULL columns with no default, missing backfills, and code that assumes the migration has already completed |
| **Adding a new authenticated endpoint** | Authentication is confirmed, but whether the query is scoped to the caller's tenant is assumed rather than verified | `/assumptions-scan --security` flags queries that filter only by primary key with no tenant/ownership clause, and proposes a concrete cross-tenant falsification test |
| **Writing a queue consumer or webhook handler** | At-least-once delivery, duplicate events, and out-of-order arrival are edge cases nobody explicitly tested | `/assumptions-scan --concurrency` or `--failure` identifies missing idempotency keys and ordering assumptions, each with a reproducible test |
| **Preparing a release / writing the PR description** | The PR description says "tested locally," with no structured list of what could still break in production | `/assumptions-scan --compact` produces a short, PR-ready table of P0/P1 risks the reviewer can act on directly |
| **Turning a risk into a regression test** | Someone identifies a risk in review, but writing the actual test is left as a follow-up that often never happens | `/assumptions-scan --tests` outputs ready-to-write falsification tests for every finding, ordered by priority |
| **Onboarding to an unfamiliar codebase or diff** | A large or unfamiliar diff gets a shallow pass because there's too much to hold in your head at once | The skill's oversized-scope handling picks the highest-risk subset (auth, payments, migrations, concurrency-sensitive paths) and explicitly states what was excluded |
| **Deciding whether a concern is worth blocking on** | Findings get flagged as "critical" based on gut feel, or dismissed as "probably fine" with no real justification | Every finding carries an explicit confidence label (Verified / Likely / Unknown / Assumption to verify) and priority (P0–P3), so severity is argued from evidence, not vibes |

---

## 📑 Table of Contents

- [Assumptions](#assumptions)
  - [Why not just ask your AI assistant to review this?](#why-not-just-ask-your-ai-assistant-to-review-this)
  - [🎯 Use Cases](#-use-cases)
  - [📑 Table of Contents](#-table-of-contents)
  - [Example](#example)
  - [Installation](#installation)
  - [Usage](#usage)
  - [What this is not](#what-this-is-not)
  - [Repository layout](#repository-layout)
  - [Privacy and cost](#privacy-and-cost)
  - [Contributing](#contributing)
  - [🔎 Discovery \& Registries](#-discovery--registries)
  - [Support Development](#support-development)
  - [🌐 Related Projects](#-related-projects)
    - [Privacy \& Encryption](#privacy--encryption)
    - [Security Tools](#security-tools)
    - [MCP Security Servers](#mcp-security-servers)
  - [License](#license)

---

## Example

```
/assumptions-scan
```

```
| Priority | Assumption | If false | Falsification test |
|---|---|---|---|
| P0 | A payment request is processed once. | A retry charges the customer twice. | Replay the same request concurrently. |
| P1 | New workers never see the old schema. | Rolling deploy causes worker failures. | Run new code against the old schema. |
```

## Installation

No build step, no dependencies, no account. `SKILL.md` is the entire
skill — copy it into wherever your agent looks for skills.

**Claude Code (project-level):**

```bash
mkdir -p .claude/skills/assumptions
cp /path/to/Assumptions/SKILL.md .claude/skills/assumptions/SKILL.md
```

**Claude Code (user-level, available in every project):**

```bash
mkdir -p ~/.claude/skills/assumptions
cp /path/to/Assumptions/SKILL.md ~/.claude/skills/assumptions/SKILL.md
```

Replace `/path/to/Assumptions` with wherever you cloned this repository
(e.g. `git clone <this-repo-url>` first, or download `SKILL.md` directly
from this repo's file view and save it to that path).

**Any other agent:** clone or download this repository and point your
agent's skill/instruction configuration at `SKILL.md`. It's written to
work with any agent that can read a `SKILL.md`-style instruction file and
inspect a local Git repository — Claude Code is the reference target, but
nothing here is Claude Code-specific.

Verify it's picked up:

```bash
/assumptions-scan
```

If your agent doesn't auto-discover skills, paste the contents of
`SKILL.md` directly into a system prompt or custom instructions field —
it's a self-contained Markdown document.

## Usage

```
/assumptions-scan
/assumptions-scan src/billing/create-refund.ts
/assumptions-scan --deploy "Add a nullable organization_id column, backfill it, then require it"
/assumptions-scan --concurrency "Can two people redeem the same invite?"
/assumptions-scan --failure "What happens if Stripe times out after charging the customer?"
/assumptions-scan --tests src/billing/create-refund.ts
/assumptions-scan --compact
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

Assumptions is a local, open-source skill. It has no hosted backend,
telemetry, database, or account requirement. You use it with your own
coding agent environment.

## Contributing

This project stays intentionally small on purpose — the value is in a
disciplined method and a trustworthy output format, not feature surface
area. The highest-leverage contribution is a new **example** or
**fixture** showing a realistic hidden assumption the skill should catch.
See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the exact format — most
contributions are a single Markdown file.

## 🔎 Discovery & Registries

If you find this useful, a star or a mention helps other people find it.
Assumptions is a plain `SKILL.md`, so it's compatible with general-purpose
agent-skill directories and marketplaces (e.g. awesome-agent-skills lists,
`skills.sh`, SkillsMP) without any extra packaging — feel free to submit
it wherever you discover skills like this one.

---

<!-- donation:eth:start -->
<div align="center">

## Support Development

If this project helps your work, support ongoing maintenance and new features.

**ETH Donation Wallet**  
`0x11282eE5726B3370c8B480e321b3B2aA13686582`

<a href="https://etherscan.io/address/0x11282eE5726B3370c8B480e321b3B2aA13686582">
  <img src="assets/publiceth.svg" alt="Ethereum donation QR code" width="220" />
</a>

_Scan the QR code or copy the wallet address above._

</div>
<!-- donation:eth:end -->

---

## 🌐 Related Projects

Explore more privacy-first and security tools:

### Privacy & Encryption
- **[Timeseal](https://github.com/Teycir/Timeseal)** - Time-locked encryption vault with Dead Man's Switch. AES-256 split-key crypto, ephemeral seals.
- **[Sanctum](https://github.com/Teycir/Sanctum)** - Zero-trust encrypted vault with cryptographic plausible deniability. XChaCha20-Poly1305, Argon2id.
- **[GhostChat](https://github.com/Teycir/GhostChat)** - True P2P encrypted chat via WebRTC. No servers, no storage, self-destructing messages.
- **[xmrproof](https://github.com/Teycir/xmrproof)** - Monero payment verification, 100% client-side.
- **[GhostReceipt](https://github.com/Teycir/GhostReceipt)** - Anonymous receipt generation with zero-knowledge proofs.

### Security Tools
- **[BurpAPISecuritySuite](https://github.com/Teycir/BurpAPISecuritySuite)** - Burp Suite extension for API security testing. 15 attack types, 108+ payloads, BOLA/IDOR detection.
- **[Mcpwn](https://github.com/Teycir/Mcpwn)** - Automated security scanner for Model Context Protocol servers. Detects RCE, path traversal, prompt injection.
- **[DiffCatcher](https://github.com/Teycir/DiffCatcher)** - Git repo discovery, diff capture, code element extraction.
- **[HoneypotScan](https://github.com/Teycir/HoneypotScan)** - Honeypot detection service for security research.
- **[CheckAPI](https://github.com/Teycir/CheckAPI)** - LLM API key validator for multiple providers. Privacy-first, client-side validation.
- **[SeekYou](https://github.com/Teycir/SeekYou)** - Host intelligence aggregator — unified OSINT across 15 sources for IPs, domains, and ASNs.

### MCP Security Servers
- **[burp-mcp-server](https://github.com/Teycir/burp-mcp-server)** - MCP server for Burp Suite Professional. Vulnerability scanning via AI assistants.
- **[nuclei-mcp](https://github.com/Teycir/nuclei-mcp)** - MCP server for Nuclei. Multi-target scanning, severity filtering.
- **[nmap-mcp](https://github.com/Teycir/nmap-mcp)** - MCP server for Nmap. Stealth recon, vuln/NSE scanning.
- **[frida-mcp](https://github.com/Teycir/frida-mcp)** - MCP server for Frida. Dynamic instrumentation, SSL pinning bypass.

---

## License

MIT — see `LICENSE`.
