---
icon: 🎫
---

# Linear Tickets

How a ticket in the Engineering (ENG) Linear team is written, so people and agents find the scope by heading. The headings below are a contract: agents read and edit sections by these exact names.

**Feature ticket** — an ENG ticket made from the Feature template: `Problem`, `Acceptance criteria`, `Decisions`. The default for team members; presets `🌟 feature` and Backlog.
**Bug ticket** — an ENG ticket made from the Bug template: `Problem`, `Where`, `Steps to reproduce`, `Expected result`, `Acceptance criteria`, `Decisions`. The default for non-members; presets `🐛 bug` and Triage.
**Problem** — what is wrong today and for whom. On a Bug ticket, the actual result.
**Where** — the edition (Cloud, self-hosted CE, self-hosted EE), the surface (app, Embed, MCP client), the version, and a link to the flow or run.
**Steps to reproduce** — numbered steps another engineer can repeat.
**Expected result** — what must happen instead, in the reporter's words. The engineer turns it into acceptance criteria.
**Acceptance criteria** — one check per bullet; each bullet ends with ``E2E: `<test title>` `` or `no-e2e: <reason>`. The contract for done. On a Bug ticket the engineer writes them at triage. _Avoid_: "Done when"
**Decisions** — one decision per bullet with a one-line why. Out of scope is a decision: "Not X, because Y."
**no-e2e** — the ticket label for one or more criteria with no E2E test. The bullet markers are the source; the label follows them.
**Done** — the PR is merged.
**PR link** — the ticket line in a PR description: `Fixes <KEY>-123` on the last PR of a ticket, `Refs <KEY>-123` on an earlier one. Any team key works. The `Linear ticket check` workflow fails a PR that names no ticket, or one that does not exist or is canceled; it does not read the ticket's content.
**Customer report** — a ticket that comes from a Pylon issue. It links that issue as the attachment "Pylon NNNN (customer report)".

## Gotchas

- The AI team keeps its own form templates (Goal / Done when / How) and the `ai-task` skill. The two vocabularies differ on purpose for now.
- Box files production bugs with the `automated` label and opens fix PRs, and it learns only from comments that mention `@box`. When you reject its PR, change its fix or decide something, mention it and end with **For Box next time:** the lesson. `/ai-task` does this. Box runs as you: connect Claude and GitHub once at https://box.abuaboud.me/boxes?new, or it only replies "finish setting up Box first". It ignores mentions in replies, so a retry is a new comment.
- The template text lives in Linear, not in the repo. Renaming a heading means changing the template, this page and the agent rule `.claude/rules/linear-tickets.md` together.
- Placeholder text in a template disappears when the writer types, so no rule may live only in a placeholder. Rules live here and in the agent rule.
- A ticket created through the MCP, the API, Slack or a support integration gets no template, so it can miss headings. The team default applies only in the Linear UI: an agent creating a ticket passes `template: "Feature"` or `"Bug"` to `save_issue`, and adds a missing heading rather than assume the section is empty.
- A template applied through the MCP keeps the headings and presets but strips the placeholder text, so the sections arrive empty.
- Both templates are standard templates. A form template may not write the `##` headings that agents parse.
- A GIT ticket syncs to a public GitHub issue, so a customer report there holds no customer name or data. The Pylon link may stay: it opens only with a Pylon login.
