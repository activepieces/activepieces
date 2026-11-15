---
icon: 🔁
---

# AI Quality Loop

How the AI team learns what goes wrong in real chats, turns it into tests, and proves a fix worked. The full plan is the "AI quality loop plan" document in Linear project P-AI-339; tickets AI-182 to AI-200 build it.

**Quality review**: the Sun/Tue/Thu read of 20 real chat turns in a PostHog review queue, run with `/ai-task quality`. 10 random (labeled blind) and 10 that built a flow which was never published.
**Blind label**: a human pass/fail plus problem type given without seeing any judge verdict or draft. Only blind labels can check a judge.
**Problem type**: a named, recurring way chat fails, kept as a PostHog score definition. One Linear ticket per type.
**Judge**: a PostHog online evaluator that scores every trace. We trust it only once its true-positive and true-negative rates hold on 20+ labeled fails and 20+ labeled passes. _Avoid_: "agreement %" as the trust measure.
**Private test case**: a real chat saved in PostHog Datasets with secrets stripped, cut at one decision point. _Avoid_: "fixture" for these; fixtures are the public hand-written cases in the repo.
**Path changed**: a replayed case where the agent called a different tool than the recording. A higher rate than main counts against the PR.
**Paired score**: main and the branch run in one job on the same cases and are compared case by case.

## Rules

- Customer chats never go into the repo, `calibration/` or the public CDN.
- The scheduled report only drafts. A person confirms before anything is filed in Linear, and tickets carry trace ids and counts, never chat text.
- Outcomes (built, published, ran) point at where to look. Proof of a fix is the paired score, then the problem rate dropping in later reviews.
- No score blocks a PR until main-vs-main runs have measured its noise.

## Gotchas

- `gen_ai.agent.name = 'agent-turn'` marks a real chat turn in PostHog. Titles, memory, compaction and tool repair are separate traces (`agent-title`, `agent-memory`, `agent-compaction`, `agent-tool-repair`); count them out or every rate is off.
- Traces don't say which door (chat, saved agent, agent builder, flow step) a turn came from yet. Add it before splitting quality by door (AI-185).
- The chat → outcome join needs no new code: the `execute_tool ap_build_flow` span holds `flowId` in `gen_ai.tool.call.result`, and `flow.published` / `run.created` carry `flowId`. About 15% of build spans have no `flowId`.
- A judge's pass or fail comes from its `output_config`: `true_is_failure: false` means `true` passes. Our Hog checks return `true` for pass, so "Context too large = true" means the call passed.
- Skipped judge runs (session too large, or anything else that couldn't be graded) still store `result = false`. Always filter on `$ai_evaluation_skipped`, never on the reasoning text: on Nov 5 the text match missed 2,673 of 2,720 skipped runs and made Hallucination look like 35% instead of 5%.
- AI spans are scrubbed at export by `aiTraceScrubber`: fields named like token, password or secret are redacted at any JSON depth, including JSON inside text, and errors go out as their type only. A secret typed into chat as free text isn't caught.
- The eval replay hands the agent a stub when it calls an unrecorded tool and keeps going, so a wrong tool can look fine until AI-194 lands.
- Repeats of one case are not independent tries. A gate built on raw pass rates can only spot drops 2 to 3 times bigger than it looks like it can.

## Key files

- `.agents/skills/ai-task/`: the `quality` moment and its `sql/quality-*.sql` queries
- `packages/server/worker/test/lib/agent-eval/`: the eval harness, replay and judge (`runner`)
- `packages/server/utils/src/ai-observability.ts`: exports AI spans to PostHog (`aiObservability`)
- `.github/workflows/agent-evals.yml`: the PR, nightly and weekly eval runs
