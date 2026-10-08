---
name: ai-task
description: The AI team's one command for doing a task the team way, from ticket to merged PR. Use when an engineer on the AI team (chat, agents, MCP, AI providers) starts a task ("/ai-task AI-123", "start AI-123", "work on this bug"), turns a request or customer report into a ticket ("/ai-task customer says chat won't save"), triages or answers a bug or support question ("/ai-task triage ENG-456"), or is about to open or update a PR ("/ai-task ship"). Also lets support, admins and anyone outside the team report an AI bug or request ("/ai-task report ..."). Grills the user one question at a time ("/ai-task grill AI-123") until a ticket is solvable without asking anyone. Runs the team check-up ("/ai-task check", "check the AI roadmap", "how is activation", "weekly AI update"): activation and cost from production plus late, blocked or waiting work in Linear. It does the Linear, brain and PR paperwork so the user only answers what it can't work out.
---

# AI task

One command, five moments: **start**, **triage**, **ship**, **check** (AI team members) and **report** (anyone). Work out which one from what the user typed. If it's unclear, ask once.

Whenever a ticket is being created or is too thin to solve, run a **grill** (below) inside that moment.

## Requirements (check first, every run)

Run these checks before anything else, silently when they pass. If one fails, show only the card for that failure and stop.

1. **Linear connected.** Call the Linear MCP for the current user (`get_user` with `me`). If the tool is missing or the call fails with an auth error, stop:

   > ### Connect Linear first
   > 1. Type `/mcp` in Claude Code
   > 2. Pick **Linear**, then sign in
   > 3. Run `/ai-task` again

2. **Who you are.** The same `get_user` call returns the user's `teams`. They're a member if team key `AI` is in the list.
   - **Member:** every moment is open.
   - **Not a member** (support, admins, other teams): only **report** is open. If they asked for start, triage or ship, show:

   > ### You're not on the AI team
   > You can still report a bug or a request:
   > `/ai-task report <what happened>`
   >
   > Joining the team? Ask the AI team lead.

3. **Repo** (start, triage, ship and check). The current directory must be the activepieces repo (`git rev-parse --show-toplevel` with `brain/knowledge/` inside). If not, stop:

   > ### Open the activepieces repo
   > Run Claude Code inside your activepieces checkout, then run `/ai-task` again.

4. **Production data** (triage and check only, optional). If the box MCP isn't connected, say it in one line under **Heads up** and continue with code evidence alone. Never stop for this.

## Help (no arguments, "help", or "?")

Run the requirement checks first, then show the card that fits.

**Member card**

> ### /ai-task
> You code, it does the paperwork.
>
> - `/ai-task AI-123`: start a ticket
> - `/ai-task customer says X`: turn a request into a ticket
> - `/ai-task triage ENG-456`: check a bug, close or route it
> - `/ai-task ship`: get your PR ready
> - `/ai-task grill AI-123`: make a ticket solvable
> - `/ai-task check`: team check-up (Thursdays)
> - `/ai-task report X`: report a bug for someone else
>
> **Rules:** Linear doc "Start here: how the AI team works"
> Nothing goes out under your name without your OK.

**Non-member card**

> ### /ai-task
> Report an AI bug or request to the AI team.
>
> - `/ai-task report chat won't save my flow`
> - Paste links, screenshots or the customer's words. It asks for anything missing.
>
> It lands in the AI team's Triage, and the team checks it.

If the user seems new, add one line: "Try it now on the ticket you're working on" (member) or "Try it now with something a customer told you" (non-member).

## Grill: make the ticket solvable

**The bar:** another engineer, or Claude, can solve the ticket without asking anyone anything.

**When it runs:**
- **Always** when creating a ticket (`report`, `customer says X`).
- **At start,** when the ticket fails the checklist below.
- **Before planning** a feature or spike that still has open decisions.
- **On demand:** `/ai-task grill AI-123`.

**How (the grill-me method):**
- **One question at a time,** each with your recommended answer, so the reply can just be `y`.
- **Look before you ask.** If the code, ticket, logs or conversation answer it, don't ask. Write it into the ticket as a fact.
- **Walk the tree:** settle the decisions others depend on first (scope before UI, data before API).
- **Show progress** (`Q3 of ~7`), and accept `enough` at any point. Gaps left open go under **Open questions** in the ticket.

**The solvable checklist:**
- **Bug:**
  - exact steps: account type, edition, input;
  - expected against actual;
  - who's affected, and how many;
  - the code area (file → function);
  - a failing test that would prove it;
  - what's out of scope.
- **Feature:**
  - the user's goal in one line;
  - a "done when" you can check;
  - 3 to 6 acceptance criteria, each testable;
  - which surfaces it touches (API, UI, worker, MCP, chat tools);
  - editions, with zero setup on self-hosted;
  - flag or rollout;
  - what's out of scope;
  - the decisions made.
- **Spike:**
  - the question;
  - the options;
  - how we'll decide (which numbers);
  - the time box.

**Non-members (light grill):**
- Ask only what the user saw: what happened, steps, where, who, and a link.
- Never ask them about code. Find the code area yourself if the repo is open, or leave it for triage.
- About 5 questions at most.

**Write the ticket in these sections:**
1. Goal or context
2. Done when
3. Acceptance criteria (or steps, for a bug)
4. Where in the code
5. Out of scope
6. Decisions (from the grill)
7. Open questions

Show the ticket card before creating or updating it.

## Report: anyone, member or not

For support, admins and anyone outside the team, and for members reporting on someone else's behalf.

1. **Find duplicates first.** Search team AI's open issues for the same problem. If one exists, offer to add the new details as a comment on it instead.
2. **Pick the form:** Bug report if something is broken, Feature if it's a request.
3. **Fill the form's fields** from what they gave you, then **grill** for the rest: light for non-members, full for members.
   - **Bug:** what happens, steps, what should happen, where (Cloud, Self-hosted, Embed or MCP client), customer, and a link.
   - **Feature:** goal, and who asked.
4. **Never guess a priority for a non-member.** Leave it for triage, unless they say data loss, a security issue or a billing problem; then mark it Urgent and say why.
5. **Security:** if it looks like a security issue, don't write the details in the ticket. Create it with a neutral title and tell them to send the details privately to the AI team lead.
6. **Show it before creating:**

   > ### New bug for the AI team
   > **Title:** <8 words or fewer>
   > **Where:** <Cloud / Self-hosted / Embed / MCP client>
   > **Customer:** <name or none>
   >
   > **Create it?** y / change

7. **Create it** in team AI with status **Triage** and no assignee, then reply with the link and one line: "The AI team will check it."

Do the paperwork yourself. Ask only for facts you can't find in the ticket, the code, the logs or the conversation. In a grill, ask one at a time. Everywhere else, ask for all of them in one message.

Write everything (tickets, comments, PR text) short and plain, with no em dashes. Follow the humanizer skill if it's installed.

## How to answer the developer (strict)

The developer reads your reply in 5 seconds. They don't read paragraphs.

- **Use the card for the moment** (below), as rendered markdown. **Never in a code block**: code blocks don't wrap well in a terminal and turn into a wall.
- **Say the moment once.** No "Starting AI-123." line before the card; the card's heading is enough. Don't narrate tool calls or what you're about to do.
- **Every line fits in about 60 characters.** One fact per bullet. No `·` chains with more than 2 items.
- **Plan steps are 8 words or fewer.** Name the place (`validateAction`), not the reasoning.
- **No why** unless they type `why` or `details`. Evidence is a pointer: `validateAction`, `PR #123`, `3 of 66 failed`.
- **The question is the last line, alone,** and short: `**OK?** y / change`. Fold every choice (cycle, size, template rewrite) into the setup bullets as defaults, not into the question.
- **Side notes** (worktree, dirty branch) get one short bullet under **Heads up**, or nothing.
- **Long content goes where it lives,** like the ticket comment or the PR description. Reply with the link.

**Start card**

> ### AI-123 · still real ✓
> <title, 8 words or fewer>
>
> **Done when:** <one line>
>
> **Plan**
> 1. <step, 8 words or fewer>
> 2. <step>
> 3. <step>
>
> **I'll set up**
> - You, In Progress, <cycle>
> - Size <guess>, <project>
> - Ticket rewritten in the template (only if needed)
>
> **Read:** `<one brain page>`
> **Run:** <box or local, one line, only if needed>
> **Heads up:** <one line, only if needed>
>
> **OK?** y / change

**Grill card** (one per question)

> **Q3 of ~7 · Scope**
> <the question, one line>
>
> **My pick:** <recommended answer>
>
> y / your answer / enough

**Triage card**

> ### ENG-456 · <verdict: real / fixed by PR #n / duplicate / won't do>
> <title, 8 words or fewer>
>
> **Why:** <one pointer>
> **Move to:** <team, project, priority, cycle> (or: close as Done)
> **Comment:** drafted
>
> **Post and move?** y / change

**Ship card**

> ### PR #123 · ready ✓ (or: 2 things to fix)
> <user-facing title>
>
> - ✓ Fixes AI-123
> - ✓ Labels, boxes, lint
> - ✗ <each failure, one line>
>
> **Push and update?** y / change

## Team truth (read it, don't assume)

- **Team rules:** the Linear doc "Start here: how the AI team works" (team AI). It covers the templates, the work-in-progress limit, review time and rituals. If a rule there disagrees with this skill, the doc wins.
- **How things work:** `brain/knowledge/` in the repo. Find the area's page with grep and read it before touching code (the repo's CLAUDE.md requires this).
- **Ticket shape:** the AI team's issue templates. Feature: Goal, How, Done when. Bug report: what happens, steps, what should happen, where. Spike or decision: the question, why we need it, options, decide-by date.
- **PR rules:** the repo's CLAUDE.md "Pull Requests" section and `.github/pull_request_template.md`.

## Start: a ticket id, a link, or a plain request

1. **Get the ticket.**
   - **Given an id or link:** read it with the Linear MCP.
   - **Given a plain request:** search team AI for a duplicate first. If none, write the ticket in the matching template and show it before creating it.
   - **Thin ticket** (fails the solvable checklist): fill in what you can from the code and conversation, then **grill** for the rest before planning.
2. **Check it's real and still needed.**
   - **Bugs:** check the code on `origin/main` (`git fetch origin main`, then read with `git show origin/main:<path>`). If it's already fixed, stop and go to Triage, which closes it with evidence.
   - **Features:** check nothing on main or in open PRs already does it.
3. **Put it in place.** Propose all of this in one message and apply it after one OK:
   - assignee: the user;
   - status In Progress;
   - **cycle:** the running cycle (or the next one if none is running). If the ticket is already planned for a later cycle, ask whether to pull it in now. Never move it silently;
   - the right project and milestone;
   - one "AI area" label;
   - a priority;
   - **a size (XS to XL)** if it has none, with your guess, since "Start here" asks every ticket to be sized;
   - **template shape:** if the description doesn't follow the template (old or moved tickets), offer the rewritten Goal / Done when (or the bug steps) and save it as part of the same OK. Keep the original text below it.

   Warn, don't block, if the user already has more than the in-progress limit from "Start here".
4. **Read before planning:** the brain page for the area, and the files the ticket names.
5. **Give a short plan**, five lines at most. If a feature or spike still has open decisions, grill first.
   - **Bug:** reproduce it first (ideally a failing test), find the root cause in the shared function every caller goes through, fix it there, and keep the test.
   - **Feature:** restate "done when" as something checkable. Name the edition paths to test (CE, EE, Cloud). Flag anything that needs setup on self-hosted, since the default must be zero setup.
   - **Spike:** the question, the time box, and where the answer gets written (`brain/knowledge/decisions/` if it's a hard-to-reverse call).
6. **How to run it.** If the task needs the app running, add one **Run:** line. Chat and agents need Postgres and Redis (not the PGLite dev DB) plus a model key in `.env.dev`. The fastest path is a dev box: `box new -n <ticket-id>`. For model tiers, point to `brain/knowledge/ai-intelligence/testing-model-tiers-locally.md`.
7. **Branch:** use the ticket's branch name (`feature/ai-<n>`) or the user's own. Create it from `origin/main` only if the user wants that. Never switch branches with local changes they haven't committed.

## Triage: a bug, a support question or an old ticket

1. **Read it**, plus any linked runs, flows or conversations.
2. **Verify against main** (`git show origin/main:...`). If the box MCP is connected, also check production:
   - ClickHouse `default.otel_logs` for errors, with windows of 3 days or less;
   - the Postgres replica for the row in question, read only.
   - If the box isn't connected, say so and go on with code evidence alone.
3. **Decide one of these** and write a short comment with the evidence (files, functions, PRs, numbers). Don't post the comment without the user's go-ahead.
   - **Fixed already:** name the PR that fixed it, then move to Done.
   - **Duplicate:** link the original. Set the duplicate relation first, then the status.
   - **Not a bug / won't do:** say why in one line, then Canceled.
   - **Real:** root cause and a fix hint (the one shared place to fix it). Set a priority using the Bug report form's scale, and move it to team AI, the right project and milestone, and a cycle. Leave the owner empty unless the user takes it.
4. **Security:** if it touches auth, secrets, permissions or data exposure, say so. It gets fixed through a private advisory, never a public PR or a public ticket comment with details.
5. **Support reply:** if a customer is waiting, draft a reply to them, plain and with no internal file names, for the user to send.

## Ship: before opening or updating a PR

Run these checks and fix what you can, then show one short summary of what changed:

1. **Linked ticket.** The PR description starts with `Fixes AI-<n>` when merging finishes the ticket, or `Part of AI-<n>` when it doesn't. No ticket? Make one with Start first.
2. **Title:** written for users, not engineers, because it feeds the changelog. Keep the repo's prefix style, e.g. `fix(chat): long chats no longer fail`.
3. **Description:**
   - what changed;
   - how it was tested, including which edition paths and whether it was checked in the app;
   - both required boxes (Breaking change, Security impact) ticked, exactly one each.
4. **Labels,** from the repo's CLAUDE.md:
   - exactly one of `🌟 feature`, `🐛 bug` or `skip-changelog`;
   - the pieces label if pieces changed;
   - `⛓️‍💥 breaking-change` only together with a docs entry.
5. **Size:** if a reviewer can't read it in about 20 minutes, suggest how to split it before opening.
6. **Lint:** run `npm run lint-dev` and report the result. Don't hide failures.
7. **AI behavior check.** If the diff touches chat or agent prompts (`packages/server/api/src/assets/prompts/`), tool descriptions or the agent loop (`packages/server/worker/src/lib/execute/jobs/ee/agent/`), run `npm run agent-evals:ci`. It calls a model, so say so first. Report pass, or which fixtures regressed. Without a key in `.env.dev`, say it under **Heads up** and continue.
8. **Ticket:** set it to In Review when the PR is open. If the work taught something the next engineer needs, add it as a bullet under `Gotchas` on that area's brain page, in this PR.
9. **Project update:** if the PR finishes a milestone, offer a 3-line project update draft.

Ask before pushing, opening the PR, or posting to Linear or GitHub. Everything goes out under the user's name.

## Check: the team check-up (Thursday, or before a PM review)

`/ai-task check` (weekly) or `/ai-task check monthly`. Read only until the user approves a write. Any member can run it; the lead runs it every Thursday.

1. **Cohort.** Activation needs 7 days after the first chat.
   - **Weekly:** the 7 days that ended 7 days ago.
   - **Monthly:** the last full calendar month that is at least 7 days old.
   - **If the user names dates,** use those.
2. **Numbers** (needs the box; without it, skip to 3 and say so under **Heads up**):
   - `scripts/activation.sh <since> <until>` gives the funnel and what happened to chat-built flows. It reads the SQL from the brain page `flows-execution/chat-activation-metric.md`.
   - `scripts/cost.sh 3` gives chat turns, failures, tokens and cache share per day and release. Never more than 3 days.
   - **Alarm** if average input per turn is up more than 25%, or failed turns are above 5%. Name the release where it moved.
   - Compare against the last row in "How we measure".
3. **Team** (Linear MCP, team AI and its active initiative only):
   - **Cycle:** use the running cycle, or the next one if none is running. Flag people with clearly more open tickets than others, and tickets with no size.
   - **Late:** open issues past their due date. **Blocked:** an unfinished `blockedBy`.
   - **Work in progress:** In Progress projects per lead, against the limit in "Start here". **Quiet:** In Progress projects with no update in 8 days.
   - **Waiting:** AI PRs with no review after 1 working day, decisions past their decide-by date, and triage items older than 2 days.
   - **Rituals:** repeating tickets skipped last time.
   - **Habits:** AI PRs from the last 7 days without `Fixes AI-` or `Part of AI-` (use `gh pr list --state all --search "updated:>=<date>" --json number,author,body,files`), and new tickets missing their template's required parts. A nudge, not blame.
4. **Report** with the check card. Then offer the writes, and do only what the user picks:
   - a row at the top of "Weekly checks" in "How we measure" (monthly runs also update the main table);
   - a funnel comment on the open activation ticket;
   - 3-line status update drafts per In Progress project and the initiative, each with a health;
   - the brain baseline row, as its own PR from a fresh `origin/main` branch with `skip-changelog`.

**Check card**

> ### Week of <date> · <on track / at risk>
>
> **Activation:** <x%> of builders (<n> of <n>), was <y%>
> **Leak:** <stage> → <stage> (<n> → <n>)
> **Cost:** <tokens per turn>, <failed %> failed, <alarm or "no alarm">
> **Team:** <one line: the biggest blocker>
>
> **Do next:** <one action>
>
> **Save to Linear?** y / pick / no

**Data setup** (once): `npm i -g @abuaboud/box`, `box login --server https://box.abuaboud.me`, `box new -n chat-activation`. Boxes can be deleted; if the scripts say "not known to Box", run `box new` again.

## Never

- Move or close tickets the user didn't point at. Fix only what this task touches.
- Post security details publicly.
- Run `git reset --hard`, `git checkout -- .` or `git clean`. Local env files must survive.
- Add process the "Start here" doc doesn't ask for.
