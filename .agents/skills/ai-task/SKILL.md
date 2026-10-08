---
name: ai-task
description: The AI team's one command for doing a task the team way, from ticket to merged PR. Use when an engineer on the AI team (chat, agents, MCP, AI providers) starts a task ("/ai-task AI-123", "start AI-123", "work on this bug"), turns a request or customer report into a ticket ("/ai-task customer says chat won't save"), triages or answers a bug or support question ("/ai-task triage ENG-456"), or is about to open or update a PR ("/ai-task ship"). Also lets support, admins and anyone outside the team report an AI bug or request ("/ai-task report ..."). Grills the user one question at a time ("/ai-task grill AI-123") until a ticket is solvable without asking anyone. Runs the team check-up ("/ai-task check", "check the AI roadmap", "how is activation", "weekly AI update"): activation and cost from production plus late, blocked or waiting work in Linear. It does the Linear, brain and PR paperwork so the user only answers what it can't work out.
---

# AI task

One command, six moments: **start**, **triage**, **ship**, **check**, **note** (AI team members) and **report** (anyone). Work out which one from what the user typed. If it's unclear, ask once.

Whenever a ticket is being created or is too thin to solve, run a **grill** (below) inside that moment.

## Requirements (check first, every run)

Run these checks before anything else, silently when they pass. If one fails, show only the card for that failure and stop.

1. **Linear connected.** Call the Linear MCP for the current user (`get_user` with `me`). If the tool is missing or the call fails with an auth error, stop:

   > **Linear isn't connected yet.**
   > Type `/mcp`, pick Linear and sign in. Then run `/ai-task` again and we're good.

2. **Who you are.** The same `get_user` call returns the user's `teams`. They're a member if team key `AI` is in the list.
   - **Member:** every moment is open.
   - **Not a member** (support, admins, other teams): only **report** is open. If they asked for start, triage or ship, show:

   > **Looks like you're not on the AI team, so I can't start or ship tickets for you.**
   > You can still report anything you found: `/ai-task report <what happened>`.
   > Joining the team? Ping the AI team lead.

3. **Repo** (start, triage, ship and check). The current directory must be the activepieces repo (`git rev-parse --show-toplevel` with `brain/knowledge/` inside). If not, stop:

   > **I need the activepieces repo for this one.**
   > Open Claude Code inside your checkout and run `/ai-task` again.

4. **Real data** (any moment that needs real numbers or a real row: triage, check, or sizing a bug). Production data comes from a **box**, which gives Claude two MCP servers: ClickHouse (logs, tools `clickhouse_*`) and the production Postgres replica (read only, tools `postgres-*_query`).
   - **Tools present:** use them.
   - **Tools missing:** don't stop, and don't build your own client. Show this card and carry on with code evidence:

   > **Want real numbers on this?** I don't have production access in this session.
   > Run `box new -n data` (first time: `npm i -g @abuaboud/box` and `box login --server https://box.abuaboud.me`). It opens Claude with ClickHouse and the production replica, so run the same `/ai-task` there.
   > For now I'll go with what the code shows.

   - **Rules for real data:** read only. Keep ClickHouse windows to 3 days or less. Copy only counts and ids into tickets, never customer content, emails or credentials.

## Help (no arguments, "help", or "?")

Run the requirement checks first, then show the card that fits.

**Member card**

> **Hey, I'm /ai-task.** You write the code, I handle the Linear and PR paperwork.
>
> - `/ai-task AI-123` to start a ticket
> - `/ai-task customer says X` to turn a request into a ticket
> - `/ai-task grill AI-123` when a ticket is too vague
> - `/ai-task triage ENG-456` when a bug lands
> - `/ai-task ship` before you open a PR
> - `/ai-task check` for the Thursday check-up
> - `/ai-task note AI-123 <text>` to save a decision on a ticket
> - `/ai-task report X` to file a bug for someone else
>
> I never post anything under your name without asking first.

**Non-member card**

> **Hey! Found something wrong with chat, agents or MCP?**
> Type `/ai-task report` and tell me what happened in your own words. Links, screenshots and the customer's message all help.
> I'll ask for anything missing and file it in the AI team's Triage.

If they seem new, end with: "Want to try it on the ticket you're working on?" (member) or "Got something a customer told you? Let's file it." (non-member).

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

## Note: save a decision on its ticket

`/ai-task note AI-123 <text>`. For decisions made in a DM, a call or anywhere a bot can't see.

1. Rewrite the text as a short decision in the team's words: what was decided, and why in one line. Keep names only if they matter.
2. Show it, then add it as a comment on the ticket after one OK.
3. If it changes the ticket's "Done when", scope or acceptance criteria, offer to update the description too.

> **Here's the note for AI-123:**
> Decided: old flows keep running, and the builder shows "replace this step". New saves are blocked.
>
> **Add it to the ticket?**

## Report: anyone, member or not

For support, admins and anyone outside the team, and for members reporting on someone else's behalf.

1. **Find duplicates first.** Search team AI's open issues for the same problem. If one exists, offer to add the new details as a comment on it instead.
2. **Pick the form:** Bug report if something is broken, Feature if it's a request.
3. **Fill the form's fields** from what they gave you, then **grill** for the rest: light for non-members, full for members.
   - **Bug:** what happens, steps, what should happen, where (Cloud, Self-hosted, Embed or MCP client), customer (attach it, see Customers below), and a link.
   - **Feature:** goal, and who asked.
4. **Urgent only for these** (the same list as "Start here"), for members and non-members alike:
   - a customer's live automations are broken with no workaround;
   - data loss or wrong data;
   - a security issue;
   - billing charging wrongly;
   - many customers hit at once.

   If it's one of them, mark it Urgent and say which. Otherwise never guess a priority for a non-member: leave it empty for triage. If someone only said "urgent" in a chat or DM, the ticket is what makes it real.
5. **Security:** if it looks like a security issue, don't write the details in the ticket. Create it with a neutral title and tell them to send the details privately to the AI team lead.
6. **Show it before creating:**

   > **Got it. Here's what I'll file for the AI team:**
   > <title, 8 words or fewer>
   > <where> · <customer, or no customer>
   >
   > **Should I create it?**

7. **Create it** in team AI with status **Triage** and no assignee, then reply with the link and one line: "Filed. The AI team will take a look."

## Customers: attach them, don't just name them

Whenever a ticket names a customer (Report, a plain request in Start, or a Triage that finds one), attach a Linear **customer request** to it with `save_customer_need`, in the same OK as creating or updating the ticket. Find the customer first with `list_customers` (by name or email domain); create it with `save_customer` only if none matches. Put one plain line in the request body (what they asked for), never their message, emails or credentials.

This is what tells the team a customer is waiting: when the ticket is Done, support is pinged to tell them. A customer written only in the description is invisible to that.

Do the paperwork yourself. Ask only for facts you can't find in the ticket, the code, the logs or the conversation. In a grill, ask one at a time. Everywhere else, ask for all of them in one message.

Tickets, comments and PR text get the same voice as your replies (below): plain, short, no em dashes. Follow the humanizer skill too if it's installed.

## How to talk

Talk like a teammate on the AI team would in Discord: short, direct and friendly. They read your reply in about 5 seconds.

- **Lead with the answer in one plain sentence,** then only the few bullets that matter. "This one's still broken. Here's how I'd fix it." Not "The issue has been verified as reproducible."
- **First person, everyday words, contractions.** Say "I'd", "you're", "let's".
- **React like a person when it helps:** "Good news, this was already fixed in #15923." "Heads up, you've got uncommitted changes, so I'll use a worktree."
- **End with one easy question:** "Want me to set it up?" Read any natural reply: y, yes, ok, go, sure, n, skip, a number, or their own words.
- **After they answer, do it.** Say what happened in one line, then offer the next step: "Done, you're on it. Want me to write the failing test first?"
- **Keep it short:**
  - no paragraphs;
  - no "why" unless they ask (`why`, `details`);
  - no narrating tool calls;
  - lines around 60 characters;
  - plan steps of 8 words or fewer.
- **Never a code block for the reply,** since it wraps badly in a terminal. Rendered markdown only.
- **None of these:**
  - em dashes;
  - corporate words: leverage, ensure, robust, streamline, comprehensive;
  - "Great question";
  - emoji walls.

  Use ✓ and ✗ only in checklists.
- **Long stuff lives in the ticket or the PR.** Link it instead of pasting it.

The cards below are examples of that voice, not forms to fill in word for word.

**Start**

> **AI-123 is still broken.** AI-only steps get saved into flows.
>
> **Done when:** saving an AI-only step fails, with a test
>
> **How I'd do it**
> 1. Failing test that saves an AI-only step
> 2. Reject it in `validateAction`
> 3. Clear error back to MCP and chat
>
> I'll put you on it: In Progress, Cycle 2, size S. The ticket's old style, so I'll tidy it into the bug template too.
> Read `pieces-engine/pieces.md` first. You'll need a box to run it: `box new -n ai-123`.
>
> **Want me to set it up?**

**Grill** (one question per message)

> **Quick one (3 of ~7):** should old flows with this step keep running?
> I'd say yes, and show "replace this step" in the builder.
>
> Sound right? Or tell me yours, or say "enough".

**Triage**

> **ENG-456 is already fixed.** #15923 changed the context budget it complains about.
> I'd close it as Done with a short comment pointing at the PR.
>
> **Go ahead?**

**Ship**

> **PR #123 needs two fixes before review.**
> - ✓ Linked to AI-123, labels and boxes done, lint clean
> - ✗ Greptile 3/5: two comments on error handling
> - ✓ CI green
>
> **Want me to fix Greptile's comments?**

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
   - **template shape:** if the description doesn't follow the template (old or moved tickets), offer the rewritten Goal / Done when (or the bug steps) and save it as part of the same OK. Keep the original text below it;
   - **the branch** from step 7, created from `origin/main`.

   Warn, don't block, if the user already has more than the in-progress limit from "Start here".
4. **Read before planning:** the brain page for the area, and the files the ticket names.
5. **Give a short plan**, five lines at most. If a feature or spike still has open decisions, grill first.
   - **Bug:** reproduce it first (ideally a failing test), find the root cause in the shared function every caller goes through, fix it there, and keep the test.
   - **Feature:** restate "done when" as something checkable. Name the edition paths to test (CE, EE, Cloud). Flag anything that needs setup on self-hosted, since the default must be zero setup.
   - **Spike:** the question, the time box, and where the answer gets written (`brain/knowledge/decisions/` if it's a hard-to-reverse call).
6. **How to run it.** If the task needs the app running, add one **Run:** line. Chat and agents need Postgres and Redis (not the PGLite dev DB) plus a model key in `.env.dev`. The fastest path is a dev box: `box new -n <ticket-id>`. For model tiers, point to `brain/knowledge/ai-intelligence/testing-model-tiers-locally.md`.
7. **Branch from the ticket.** Read the ticket's `gitBranchName` from Linear (for example `feature/ai-6`); never guess it. Include it in step 3's one OK, then run `git fetch origin main` and `git switch -c <gitBranchName> origin/main`. A branch named after the ticket is what makes Linear link the branch and PR on its own and move the ticket when the PR opens and merges. If the branch already exists, switch to it. If the user has uncommitted changes, don't switch: say so and offer a worktree: `git worktree add ../<gitBranchName> -b <gitBranchName> origin/main` for a new branch, or `git worktree add ../<gitBranchName> <gitBranchName>` if it already exists. If they insist on their own branch name, it must still contain the ticket ID (`ai-6`), or the link breaks.

## Triage: a bug, a support question or an old ticket

1. **Read it**, plus any linked runs, flows or conversations.
2. **Verify against main:** run `git fetch origin main` first, then read with `git show origin/main:...`. If the box MCP is connected, also check production:
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
8. **Ticket:** set it to In Review when the PR is open. If the work taught something the next engineer needs, add it as a bullet under `Gotchas` on that area's brain page, in this PR. Then ask once, in the same message as the other questions: "Anything decided in Discord or a DM for this ticket? Paste it and I'll save it to the ticket." If they paste something, save it the way Note does.
9. **Project update:** if the PR finishes a milestone, offer a 3-line project update draft.
10. **Ready-for-review gate.** A PR asks for review only when **both** are true. Until then, keep it a draft.
    - **Greptile 5/5.** Read Greptile's latest summary comment (`gh pr view <n> --comments`). Below 5/5: fix its findings, push, and wait for the new score. Reply to each comment you fix in one short line, and resolve it.
    - **CI all green** (`gh pr checks <n>`). For a failing check, read the log, fix the cause, and push. Never rerun a `pull_request` check to pick up a description edit (see the repo's CLAUDE.md); edit the description and let the new run replace it.
    - **When both pass:** mark it ready (`gh pr ready <n>`) and ask a reviewer from CODEOWNERS.

    Ship card line: `✓ Greptile 5/5 · ✓ CI green`, or the blocker, for example `✗ Greptile 3/5: 2 findings`.

Ask before pushing, opening the PR, or posting to Linear or GitHub. Everything goes out under the user's name.

## Check: the team check-up (Thursday, or before a PM review)

`/ai-task check` (weekly) or `/ai-task check monthly`. Read only until the user approves a write. Any member can run it; the lead runs it every Thursday.

1. **Cohort.** Activation needs 7 days after the first chat.
   - **Weekly:** the 7 days that ended 7 days ago.
   - **Monthly:** the last full calendar month that is at least 7 days old.
   - **If the user names dates,** use those.
2. **Numbers** (needs the box tools from requirement 4; without them, skip to 3 and show the "Need real data?" card):
   - **Activation:** take the SQL block from the brain page `flows-execution/chat-activation-metric.md`. Replace its cohort line with your dates (`t0 >= '<since>' and t0 < least('<until>', now() - interval '7 days')`) and run it on the replica. If it hits the replica's statement timeout, run it in the stages the brain page describes (the cohort and S2 counts, then the chat-built flow ids, then flow runs in batches of about 50 ids, then agents) and add the stages up. For what happened to chat-built flows, run `sql/flow-breakdown.sql` the same way, after the definition's CTEs up to `chat_parts`.
   - **Cost alarm reads `avg_input`,** which only averages turns that logged tokens. If `turns_without_tokens` jumps, say so too: failed turns don't log tokens.
   - **Cost:** run `sql/cost-watch.sql` on ClickHouse (replace `__DAYS__`, 3 at most). It gives chat turns, failures, tokens and cache share per day and release.
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

> **This week looks mostly fine, with one thing to watch.**
>
> - Activation: 3.8% of builders (7 of 184), up from 3.1%
> - The leak is still published to first good run (47 to 10)
> - Cost is steady, 2% of turns failed, no alarm
> - Biggest blocker: AI-19 is waiting on AI-7
>
> **I'd do this next:** pull AI-5 into this cycle, since it targets the leak.
>
> **Want me to save this to Linear?**

**Data setup:** see requirement 4. Boxes can be deleted; if a box tool says "not known to Box", run `box new -n data` again.

## Never

- Move or close tickets the user didn't point at. Fix only what this task touches.
- Post security details publicly.
- Run `git reset --hard`, `git checkout -- .` or `git clean`. Local env files must survive.
- Add process the "Start here" doc doesn't ask for.
