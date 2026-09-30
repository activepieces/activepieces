---
icon: 📈
---

# Chat Activation Metric

The number the chat and agents roadmap is ranked by: the share of first-time chatters who, within 7 days of their first chat, have an automation that keeps running. It is one SQL query over data that already exists, with no events, column or migration behind it.

**Activated** within 7 days of the user's first CHAT message (the first conversation whose transcript holds a user message; an opened, empty conversation doesn't count), either a chat-built flow is ENABLED with at least 3 SUCCEEDED production runs, or the user owns a published agent created in that window with at least 3 successful runs on at least 2 distinct days.
**Chat-built flow** a flow whose id is in `output.structuredContent.flowId` of a completed `ap_build_flow` part in `agent_conversation.uiMessages`, and which was created inside the 7-day window.
**Successful agent run** a conversation with an assistant reply: AGENT-source and ended IDLE, or FLOW_STEP with a `flowRunId` that is a SUCCEEDED production run.

## Stages

S1 first chat → S2 tried to build (`ap_set_build_plan`, `ap_build_flow` or `ap_create_agent`) → S3 flow built or agent created → S4 published → S5 first good production run → S6 activated. Each stage counts users who also passed the earlier ones, so the counts only go down.

## Running it

1. Open a Craftboxes box (`box new -n chat-activation`). The replica is reached through the box's `craftbox` MCP server (`postgres_query`, one read-only statement, 1000 rows max), not through `psql`.
2. The replica has a 15s statement timeout, so the single query below times out on prod. Run it in stages and join them locally:
   1. the cohort and S2 counts;
   2. the chat-built flow ids;
   3. flow state and run counts, in batches of about 50 flows passed back as `VALUES`;
   4. agents the cohort owns that were created in the window, with their published state and successful runs.
   The single query is still the definition. Save the SQL block below as `chat-activation.sql` and it runs as-is on a local or dev database with `psql -v since=2026-06-01 -f chat-activation.sql`.
3. Record the row, with the date, under Baselines.

```sql
with first_chat as (
    select "userId", "platformId", min(created) as t0
    from agent_conversation
    where source = 'CHAT' and "uiMessages" @> '[{"role":"user"}]'
    group by "userId", "platformId"
),
cohort as (
    select *, t0 + interval '7 days' as t7
    from first_chat
    where t0 >= :'since'::timestamptz and t0 < now() - interval '7 days'
),
chat_parts as (
    select c."userId", c."platformId", p
    from agent_conversation c
    join cohort k on k."userId" = c."userId" and k."platformId" = c."platformId"
    cross join lateral jsonb_array_elements(coalesce(c."uiMessages", '[]'::jsonb)) m
    cross join lateral jsonb_array_elements(coalesce(m->'parts', '[]'::jsonb)) p
    where c.source = 'CHAT' and c.created < k.t7 and p->>'type' = 'tool-call'
),
tried as (
    select distinct "userId", "platformId"
    from chat_parts
    where p->>'toolName' in ('ap_set_build_plan', 'ap_build_flow', 'ap_create_agent')
),
built_flows as (
    select distinct cp."userId", cp."platformId", cp.p->'output'->'structuredContent'->>'flowId' as flow_id, f.status, f."publishedVersionId"
    from chat_parts cp
    join cohort k on k."userId" = cp."userId" and k."platformId" = cp."platformId"
    left join flow f on f.id = cp.p->'output'->'structuredContent'->>'flowId'
    left join project pr on pr.id = f."projectId" and pr."platformId" = cp."platformId"
    where cp.p->>'toolName' = 'ap_build_flow' and cp.p->>'status' = 'completed'
        and cp.p->'output'->'structuredContent'->>'flowId' is not null
        and (f.id is null or (pr.id is not null and f.created < k.t7))
),
flow_runs as (
    select bf."userId", bf."platformId", bf.flow_id, bf.status, bf."publishedVersionId", count(r.id) as good_runs
    from built_flows bf
    join cohort k on k."userId" = bf."userId" and k."platformId" = bf."platformId"
    left join flow_run r on r."flowId" = bf.flow_id
        and r.environment = 'PRODUCTION' and r.status = 'SUCCEEDED'
        and r.created >= k.t0 and r.created < k.t7
    group by 1, 2, 3, 4, 5
),
owned_agents as (
    select k."userId", k."platformId", a.id as agent_id, a.published is not null as is_published
    from agent a
    join project pr on pr.id = a."projectId"
    join cohort k on k."userId" = a."ownerId" and k."platformId" = pr."platformId"
    where a.created >= k.t0 and a.created < k.t7
),
agent_runs as (
    select oa."userId", oa."platformId", oa.agent_id, oa.is_published,
        count(ac.id) as good_runs,
        count(distinct date_trunc('day', ac.created)) as good_days
    from owned_agents oa
    join cohort k on k."userId" = oa."userId" and k."platformId" = oa."platformId"
    left join agent_conversation ac on ac."agentId" = oa.agent_id
        and ac."platformId" = oa."platformId"
        and ac.created >= k.t0 and ac.created < k.t7
        and ac."uiMessages" @> '[{"role":"assistant"}]'
        and (
            (ac.source = 'AGENT' and ac.status = 'IDLE')
            or (ac.source = 'FLOW_STEP' and exists (
                select 1 from flow_run fr
                where fr.id = ac."flowRunId" and fr.environment = 'PRODUCTION' and fr.status = 'SUCCEEDED'
            ))
        )
    group by 1, 2, 3, 4
),
per_user as (
    select k."userId", k."platformId",
        t."userId" is not null as s2_tried,
        exists (select 1 from built_flows b where b."userId" = k."userId" and b."platformId" = k."platformId")
            or exists (select 1 from owned_agents o where o."userId" = k."userId" and o."platformId" = k."platformId") as s3_built,
        exists (select 1 from flow_runs f where f."userId" = k."userId" and f."platformId" = k."platformId" and f."publishedVersionId" is not null)
            or exists (select 1 from agent_runs a where a."userId" = k."userId" and a."platformId" = k."platformId" and a.is_published) as s4_published,
        exists (select 1 from flow_runs f where f."userId" = k."userId" and f."platformId" = k."platformId" and f.good_runs >= 1)
            or exists (select 1 from agent_runs a where a."userId" = k."userId" and a."platformId" = k."platformId" and a.good_runs >= 1) as s5_first_run,
        exists (select 1 from flow_runs f where f."userId" = k."userId" and f."platformId" = k."platformId" and f.status = 'ENABLED' and f.good_runs >= 3)
            or exists (select 1 from agent_runs a where a."userId" = k."userId" and a."platformId" = k."platformId" and a.is_published and a.good_runs >= 3 and a.good_days >= 2) as s6_activated
    from cohort k
    left join tried t on t."userId" = k."userId" and t."platformId" = k."platformId"
)
select
    count(*) as s1_first_chat,
    count(*) filter (where s2_tried or s3_built) as s2_tried_to_build,
    count(*) filter (where s3_built) as s3_built,
    count(*) filter (where s3_built and s4_published) as s4_published,
    count(*) filter (where s3_built and s4_published and s5_first_run) as s5_first_good_run,
    count(*) filter (where s6_activated) as s6_activated,
    round(100.0 * count(*) filter (where s6_activated) / nullif(count(*), 0), 1) as activation_pct
from per_user;
```

## Baselines

| Date | Cohort (first chat before) | S1 | S2 | S3 | S4 | S5 | S6 | Activation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-29 | 2026-09-22 | 850 | 280 | 229 | 91 | 44 | 25 | 2.9% |

S3 counts a flow that was built in the window and later deleted. On 2026-09-29, 68 of 381 chat-built flows had been deleted since, and agents contributed nothing: 72 exist on Cloud, 3 are published, and 2 have ever run.

## Gotchas

- **Read `uiMessages`, not `messages`.** `messages` is the model context and compaction rewrites it; `uiMessages` is the durable transcript, and it is the only one holding `ap_build_flow` results with the flowId.
- **Publish state is today's, not day 7's.** `flow.status` and `publishedVersionId` are current values, so a flow that was published and later turned off drops out of S4. Runs are windowed correctly.
- **The cohort anchor is the first CHAT message, not `chat_rollout_user.chattedAt`.** The rollout table only exists on Cloud and counts one row per user across all platforms, while S1 is per user and platform. Expect the two to be close, not equal.
- **The chatted count doesn't show the rollout cap.** Platforms whose plan has `chatEnabled` bypass the rollout, and their users still add `chattedAt` rows, so 1,505 chatted users on 2026-09-29 says nothing about `CLOUD_CHAT_ROLLOUT_CAP`.
- **Small cohorts swing.** Under the rollout cap one user moves a stage by several points, so read the counts next to the percentages.
