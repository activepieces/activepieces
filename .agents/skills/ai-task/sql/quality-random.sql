select
  toString(properties.$ai_trace_id) as trace_id,
  toString(properties.$ai_session_id) as conversation_id,
  timestamp
from events
where event = '$ai_trace'
  and properties.`gen_ai.agent.name` = 'agent-turn'
  and timestamp > now() - interval __DAYS__ day
order by rand()
limit 10
