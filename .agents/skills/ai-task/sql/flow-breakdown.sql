built_flows as (
    select distinct cp."userId", cp."platformId", k.t0, k.t7, cp.p->'output'->'structuredContent'->>'flowId' as flow_id
    from chat_parts cp
    join cohort k on k."userId" = cp."userId" and k."platformId" = cp."platformId"
    where cp.p->>'toolName' = 'ap_build_flow' and cp.p->>'status' = 'completed'
        and cp.p->'output'->'structuredContent'->>'flowId' is not null
)
select
  count(distinct bf.flow_id) built,
  count(distinct bf.flow_id) filter (where f.id is null) deleted,
  count(distinct bf.flow_id) filter (where f."publishedVersionId" is not null) published,
  count(distinct bf.flow_id) filter (where f.status = 'ENABLED') enabled_now,
  count(distinct r."flowId") with_any_prod_run,
  count(distinct r."flowId") filter (where r.status = 'FAILED') with_failed_run,
  count(distinct r."flowId") filter (where r.status = 'SUCCEEDED') with_success
from built_flows bf
left join flow f on f.id = bf.flow_id
left join flow_run r on r."flowId" = bf.flow_id and r.environment = 'PRODUCTION' and r.created >= bf.t0 and r.created < bf.t7
