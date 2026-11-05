select
  toString(properties.$ai_evaluation_name) as judge,
  count() as graded,
  countIf(toString(properties.$ai_evaluation_result) = 'false') as failed,
  round(countIf(toString(properties.$ai_evaluation_result) = 'false') / count() * 100, 1) as failed_pct,
  countIf(toString(properties.$ai_evaluation_reasoning) like 'This session%not graded%') as not_graded
from events
where event = '$ai_evaluation'
  and timestamp > now() - interval __DAYS__ day
  and toString(properties.$ai_evaluation_result) in ('true', 'false')
group by judge
order by failed_pct desc
