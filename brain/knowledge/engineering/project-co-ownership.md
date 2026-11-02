---
icon: 🤝
---

# Project Co-Ownership

How an Engineering project gets a second engineer who approves the scope before the build and reviews every PR. The approach goes public before the build, so a concern comes while it is still cheap. Tracked in the Linear project P-ENG-361; in a pilot of two projects from 2026-11.

**Co-owned project** — a Linear project with two members: the Lead and one other engineer. A project with one member keeps the old process.
**PM** — the product person who brings the idea, agrees on the acceptance criteria, watches the demo and accepts the result. Decides product concerns. _Avoid_: "Product team"
**Owner** — the engineer who scopes, writes the approach note and builds. The project Lead in Linear. Decides technical concerns.
**Co-Owner** — the one other member of the project, from the code-owner team of the area the project changes most. Approves the scope and reviews every PR. Does not build and does not take over. _Avoid_: "second pair of eyes"
**Area lead** — one per code-owner team (core, pieces, platform). Names Owners and Co-Owners, covers absences, and breaks an Owner–Co-Owner tie in 1 work day.
**Product decider** — the PM, or the founder or Owner the approach note names when the project has no PM.
**Approach note** — problem, acceptance criteria with IDs (AC-1, AC-2), approach, the rejected alternative, the five cost answers, the product decider and the Co-Owner. The Owner posts it with `/ask <ticket>` in the Discord #questions forum.
**Review window** — 1 work day from the approach note post. A concern inside it changes the plan.
**Scope approved** — the Co-Owner's comment on the Linear project. The gate: only then do the tickets move from Backlog to Todo, and agents build only from Todo. A changed acceptance criterion needs "Scope change approved" in the same way.
**Late concern** — a concern after the review window. It becomes a follow-up ticket and does not hold the merge, unless it is in a blocking class.
**Blocking class** — security, data loss, the code breaks an acceptance criterion, or an undeclared breaking change for self-hosters. It blocks at any time. A concern marked blocking with no class counts as non-blocking.
**Cost questions** — five yes/no questions in the approach note. Any yes needs one sentence on why the cost is worth it.

## Lifecycle

1. **Idea** — the PM brings a problem. An engineer-started project names a product decider in step 3.
2. **Scope** — the Owner writes the acceptance criteria and agrees on them with the PM. The area lead names the Co-Owner, who joins the project as its second member. Tickets stay in Backlog.
3. **Approach note** — the Owner runs `/ask <ticket>` and posts the note. Any engineer can comment there with the concern template. The Co-Owner must read it.
4. **Scope approved** — the Co-Owner comments on the project, which can come before the window ends. The Owner moves the tickets to Todo and the project to In Progress.
5. **Build and review** — small stacked PRs, each naming the AC it covers. The Co-Owner reviews each PR in 2 business days. Risky changes go behind a feature flag.
6. **Mid-build demo** — on staging, to the PM and the Co-Owner. Backend only: show the API call or the test run.
7. **PM acceptance** — the PM checks each AC on staging. Each gap becomes a ticket. No second technical review.

A decider answers a concern in 1 work day, then runs `/decide` in the post; the bot saves the answer to the Linear ticket. The person who raised it gets a reply, even when the answer is no.

## Cost questions

1. Does it add a new difference between CE, EE and Cloud?
2. Does it add a new plan flag?
3. Does it add an `AP_` setting or a setup step for self-hosters?
4. Does it add behaviour for one customer only?
5. Does it add a second code path for something that already exists?

The Co-Owner checks the answers at the gate. Outside a project, the PR reviewer checks them.

## Templates

```
## Approach note
Problem:
Acceptance criteria:
  AC-1:
Approach:
Rejected alternative, and why:
Cost check (Q1–Q5): no / yes + why it is worth it
Product decider: PM / founder / Owner
Co-Owner:
Window ends: YYYY-MM-DD
```

```
Concern: technical / product
Blocking: no
  (or yes: security / data loss / breaks AC-n / undeclared breaking change)
What I see:
What I suggest:
```

```
### Project
Approach note: <Discord post link>
Covers: AC-1, AC-3
Not in this PR: AC-2 (next PR in the stack)
Start reading at: <file>
```

## Co-Owner review checklist

- The code follows the approach note. A change of approach is in the ticket's Decisions.
- Each AC the PR names has a test, or a manual check in "How was this tested?".
- The CE, EE and Cloud paths behave as the note says.
- The breaking-change and security boxes are true.
- No plan flag, setting, edition branch, special case or second code path that the cost check did not declare.

## Edge cases

- **Co-Owner silent on a PR for 2 business days** — the Owner pings once; on day 3, one code owner of the area reviews that PR only. The Co-Owner reads it after the merge.
- **Co-Owner away more than a week** — the area lead names a temporary Co-Owner from the same team. The approach note is the handover.
- **Owner leaves** — the area lead names a new Owner; the Co-Owner briefs them.
- **No free Co-Owner** — limit 2 active co-owned projects per engineer. Over it, the project waits or the area lead is the Co-Owner. Never a Co-Owner from another team: the ruleset needs a code owner.
- **Owner is a contractor** — the Co-Owner is a team engineer with write access.
- **Area lead is the Owner or the Co-Owner** — a different area lead breaks a tie.
- **No PM** — the note names the product decider; with no name, the Owner decides product questions.
- **AC changes mid-build** — the PM agrees, the affected tickets go back to Backlog, and the Co-Owner writes "Scope change approved". An approach change that keeps the AC needs only a line in Decisions.
- **PM or founder concern after the window** — a follow-up ticket like any other. To change the scope now, they accept the cost on the ticket: the work to redo and the new date.
- **Two areas changed** — the Co-Owner comes from the area with the most change. A PR in the other area also needs that area's code owner.
- **Large PR (migration, generated code)** — allowed; the PR body says why and names the file to read first.
- **Work fits in one PR, a single bug, or a hotfix** — not a project. Round-robin review, no Co-Owner.
- **Rushed feature** — the gate stays but can be same-day on a short note; the window and the demo can be skipped when the PM or a founder asks and the Owner and Co-Owner agree. Decisions records each skip, and each skip gets a follow-up ticket.

## Gotchas

- Linear has no custom fields on projects and no member roles, so "the one other member" is the only Co-Owner signal. A third member breaks it.
- GitHub round-robin adds a second reviewer even when the Co-Owner is already requested, unless the team's code review assignment has "Count existing requests" on.
- A Co-Owner without write access is skipped as a code owner, so the PR cannot merge on that approval.
- A concern in a private message does not count. Only the Discord post of the approach note, or the PR, is on the record.

## Key files

- `.claude/rules/linear-tickets.md` — the agent rule that builds a co-owned project ticket only from Todo
- `.github/CODEOWNERS` — the three code-owner teams
- `github.com/activepieces/ap-discord-bot` — `/ask` and `/decide`
