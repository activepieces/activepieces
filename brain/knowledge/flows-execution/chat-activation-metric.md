---
icon: 📈
---

# Chat Activation Metric

The number the chat and agents roadmap is ranked by: the share of first-time chatters who, within 7 days of their first chat, have an automation that keeps running. It is one SQL query over data that already exists, with no events, column or migration behind it.

**Activated** within 7 days of the user's first CHAT conversation, either a chat-built flow is ENABLED with at least 3 SUCCEEDED production runs, or the user owns a published agent created in that window with at least 3 successful runs on at least 2 distinct days.
**Chat-built flow** a flow whose id is in `output.structuredContent.flowId` of a completed `ap_build_flow` part in `agent_conversation.uiMessages`.
**Successful agent run** an AGENT-source conversation that ended IDLE, or a FLOW_STEP conversation whose `flowRunId` is a SUCCEEDED production run.

## Stages

S1 first chat → S2 tried to build (`ap_set_build_plan`, `ap_build_flow` or `ap_create_agent`) → S3 flow built or agent created → S4 published → S5 first good production run → S6 activated. Each stage counts users who also passed the earlier ones, so the counts only go down.

## Running it

1. Open a Craftboxes box (`box new -n chat-activation`) and use its read-only prod replica.
2. Run the query below with `psql -v since=2026-06-01 -f chat-activation.sql`. Only cohorts whose first chat is more than 7 days old are counted.
3. Record the row, with the date, under Baselines.

```sql
with first_chat as (
    select "userId", "platformId", min(created) as t0
    from agent_conversation
    where source = 'CHAT'
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
    select distinct cp."userId", cp."platformId", f.id as flow_id, f.status, f."publishedVersionId"
    from chat_parts cp
    join flow f on f.id = cp.p->'output'->'structuredContent'->>'flowId'
    join project pr on pr.id = f."projectId" and pr."platformId" = cp."platformId"
    where cp.p->>'toolName' = 'ap_build_flow' and cp.p->>'status' = 'completed'
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

_None recorded yet._

## Gotchas

- **Read `uiMessages`, not `messages`.** `messages` is the model context and compaction rewrites it; `uiMessages` is the durable transcript, and it is the only one holding `ap_build_flow` results with the flowId.
- **Publish state is today's, not day 7's.** `flow.status` and `publishedVersionId` are current values, so a flow that was published and later turned off drops out of S4. Runs are windowed correctly.
- **The cohort anchor is the first CHAT conversation**, not `chat_rollout_user.chattedAt`. That table only exists for the Cloud rollout; on Cloud, S1 should match its chatted count for the same dates.
- **Small cohorts swing.** Under the rollout cap one user moves a stage by several points, so read the counts next to the percentages.
