with built as (
  select extract(toString(properties.`gen_ai.tool.call.result`), '"flowId"\\s*:\\s*"([A-Za-z0-9]+)"') as flow_id
  from events
  where event = '$ai_span'
    and properties.$ai_span_name = 'execute_tool ap_build_flow'
    and timestamp > now() - interval __DAYS__ + 1 day
    and timestamp < now() - interval 1 day
),
published as (
  select distinct toString(properties.flowId) as flow_id
  from events
  where event = 'flow.published'
    and timestamp > now() - interval __DAYS__ + 1 day
)
select
  uniqExact(flow_id) as built_flows,
  uniqExactIf(flow_id, flow_id in (select flow_id from published)) as published_flows,
  round(uniqExactIf(flow_id, flow_id in (select flow_id from published)) / uniqExact(flow_id) * 100, 1) as published_pct
from built
where flow_id != ''
