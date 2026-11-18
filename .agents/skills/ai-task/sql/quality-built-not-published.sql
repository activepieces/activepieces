with built as (
  select
    toString(properties.$ai_trace_id) as trace_id,
    toString(properties.$ai_session_id) as conversation_id,
    extract(toString(properties.`gen_ai.tool.call.result`), '"flowId"\\s*:\\s*"([A-Za-z0-9]+)"') as flow_id,
    timestamp
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
select trace_id, any(conversation_id) as conversation_id, groupArray(flow_id) as flow_ids, min(timestamp) as timestamp
from built
where flow_id != ''
  and flow_id not in (select flow_id from published)
group by trace_id
order by rand()
limit 10
