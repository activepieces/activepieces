---
icon: 🤝
---

# Project Co-Ownership

How an Engineering project gets a second engineer who approves the scope before the build and reviews every PR. The approach goes public before the build, so a concern comes while it is still cheap. Tracked in the Linear project P-ENG-361; in a pilot of two projects that ends on 2026-12-04.

**Co-owned project** — a Linear project with a label from the `Co-Owner` project label group. The group is single-select, so a project has one Co-Owner. A project without such a label keeps the old process.
**Co-Owner label** — one label per engineer in the `Co-Owner` group, named `<Name> (@github-login)`. It names the Co-Owner, shows in the projects list, and gives agents the reviewer login. Add a label when an engineer first becomes a Co-Owner.
**PM** — the product person who brings the idea, agrees on the acceptance criteria, watches the demo and accepts the result. Decides product concerns. _Avoid_: "Product team"
**Owner** — the engineer who scopes, writes the approach note and builds. The project Lead in Linear. Decides technical concerns.
**Co-Owner** — the engineer named by the project's Co-Owner label, from the code-owner team of the area the project changes most, and never the project Lead. Approves the scope and reviews every PR. Does not build and does not take over. Can change during the project. _Avoid_: "second pair of eyes"
**Area lead** — one per code-owner team (core, pieces, platform). Names Owners and Co-Owners, covers absences, and breaks an Owner–Co-Owner tie in 1 business day.
**Product decider** — the PM, or the founder or Owner the approach note names when the project has no PM.
**Approach note** — problem, acceptance criteria with IDs (AC-1, AC-2), approach, the rejected alternative, the five cost answers, the product decider and the Co-Owner. The Owner posts it in the Discord #questions forum with `/ask <ticket>` or the `ask` tool of the Discord MCP server (see *discord-questions*).
**Review window** — 1 business day from the approach note post. A concern inside it changes the plan. When it ends, the Owner runs `/decide` in the post or calls the `decide` tool, so the result reaches Linear.
**Scope approved** — the Co-Owner moves the project to the status Ready for Development. The gate: agents build a ticket of a co-owned project only while the project status is Ready for Development or later. When the scope grows, the Owner moves the project back to Backlog, and the Co-Owner moves it forward again after a review.
**Late concern** — a concern after the review window. It becomes a follow-up ticket with the `late-concern` label and does not hold the merge, unless it is in a blocking class.
**Blocking class** — security, data loss, the code breaks an acceptance criterion, or an undeclared breaking change for self-hosters. It blocks at any time. A concern marked blocking with no class counts as non-blocking.
**Cost questions** — five yes/no questions in the approach note. Any yes needs one sentence on why the cost is worth it.

## Lifecycle

1. **Idea** — the PM brings a problem. An engineer-started project names a product decider in step 3.
2. **Scope** — the Owner writes the acceptance criteria with IDs and agrees on them with the PM. The area lead names the Co-Owner. The Owner adds the Co-Owner label to the project. The project stays in Backlog or Planned.
3. **Approach note** — the Owner runs `/ask <ticket>` and posts the note. Any engineer can comment there with the concern template. The Co-Owner must read it.
4. **Scope approved** — the Co-Owner moves the project to Ready for Development, which can come before the window ends. If the Co-Owner does not answer in 1 business day after the window, the area lead moves it. The Owner then moves the project to In Progress when the build starts.
5. **Build and review** — small stacked PRs, each naming the AC IDs it covers. The Co-Owner reviews each PR in 2 business days. A review blocks a PR only for a mismatch with the approach note or for a blocking class; a new approach concern becomes a follow-up ticket. Risky changes go behind a feature flag.
6. **Mid-build demo** — on staging, to the PM and the Co-Owner. Backend only: show the API call or the test run.
7. **PM acceptance** — the PM checks each AC on staging. Each gap becomes a ticket. No second technical review.

A decider answers a concern in 1 business day, then runs `/decide` in the post; the bot saves the answer to the Linear ticket. The person who raised it gets a reply, even when the answer is no.

The gate binds people too: an Owner who writes code by hand follows the same gate as an agent.

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
Co-Owner: <Name> (@github-login)
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

## Pilot

Two projects, ending 2026-12-04. For each concern, record where it first appears: in the approach note or in a PR. The process works when concerns move to the approach note. Also count each merge with no Co-Owner approval. If no engineer outside the project comments in the Discord posts, drop the window and keep the Co-Owner. At the end, the team keeps or removes the agent rule in `.claude/rules/linear-tickets.md`.

## Edge cases

- **Co-Owner silent on a PR for 2 business days** — the Owner pings once; on day 3, one code owner of the area reviews that PR only. The Co-Owner reads it after the merge.
- **Co-Owner changes** — for an absence, a workload limit, or any other reason, the area lead or the Owner names a new Co-Owner from the same team and selects that engineer's Co-Owner label on the project. The project status stays, and the new Co-Owner reviews the next PRs. The approach note is the handover.
- **Owner leaves** — the area lead names a new Owner; the Co-Owner briefs them.
- **No free Co-Owner** — limit 2 active co-owned projects per engineer. Over it, the project waits or the area lead is the Co-Owner. Never a Co-Owner from another team: the ruleset needs a code owner.
- **Owner is a contractor** — the Co-Owner is a team engineer with write access.
- **Area lead is the Owner or the Co-Owner** — a different area lead breaks a tie.
- **No PM** — the note names the product decider; with no name, the Owner decides product questions.
- **AC changes mid-build** — the PM agrees, the Owner moves the project back to Backlog, and the Co-Owner moves it to Ready for Development again after a review. An approach change that keeps the AC needs only a line in Decisions. A follow-up ticket inside the approved AC needs nothing.
- **Bug or hotfix filed in a co-owned project** — the normal ticket rule applies, not the gate.
- **PM or founder concern after the window** — a follow-up ticket like any other. To change the scope now, they accept the cost on the ticket: the work to redo and the new date.
- **Two areas changed** — the Co-Owner comes from the area with the most change. A PR in the other area also needs that area's code owner.
- **Large PR (migration, generated code)** — allowed; the PR body says why and names the file to read first.
- **Work fits in one PR, a single bug, or a hotfix** — not a project. No Co-Owner and no gate: agents treat the ticket as approved in any status. Round-robin review.
- **Rushed feature** — the gate stays but can be same-day on a short note; the window and the demo can be skipped when the PM or a founder asks and the Owner and Co-Owner agree. Decisions records each skip, and each skip gets a follow-up ticket.

## Gotchas

- Linear has no custom fields on projects and no member roles. The single-select `Co-Owner` label group is the closest thing to a field. A member count is not a signal: a PM or a third member would change it.
- The gate works on trust. Anyone can change a project label or status, and Linear does not show agents who did. An agent never changes the status, labels or description of a co-owned project, because the Linear MCP writes as the engineer. The Co-Owner's PR review is the backstop.
- Other projects also use Ready for Development. The status means "Co-Owner approved" only on a project with a Co-Owner label.
- The gate fails closed: an agent that cannot read the project, its labels or its status stops.
- The ruleset accepts any code-owner approval, so GitHub does not enforce the Co-Owner. The pilot counts merges without one.
- GitHub round-robin picks a reviewer the moment the PR opens, before any Co-Owner request can exist, so "Count existing requests" never prevents it. The `Linear ticket check` workflow removes that pick: the first user request within 5 seconds after a team request, unless it is the Co-Owner. An author's own `--reviewer` request lands after the pick, so it stays. GitHub has already notified the pick, so the removal does not stop that email.
- The workflow removes nothing when the Co-Owner is the author, when the Co-Owner is not in every requested team (the ruleset needs a code owner of each team), or when someone requested the pick again later.
- The workflow cannot read team membership, so `TEAM_MEMBERS` in `tools/scripts/request-co-owner-review.ts` copies it. When a team changes, update the list from `gh api orgs/activepieces/teams/<team>/members`. A missing login fails safe: the pick stays. Delete the removal code when the pilot ends.
- A Co-Owner without write access is skipped as a code owner, so the PR cannot merge on that approval.
- An agent reads a Discord post only through the `read` tool of the Discord MCP server, when its engineer has connected it (see *discord-questions*). A window result or a concern reaches Linear only through `/decide` or the `decide` tool.
- A concern in a private message does not count. Only the Discord post of the approach note, or the PR, is on the record.

## Key files

- `.claude/rules/linear-tickets.md` — the agent rule for co-owned projects
- `.github/CODEOWNERS` — the three code-owner teams
- `github.com/activepieces/ap-discord-bot` — `/ask`, `/decide` and the Discord MCP server
