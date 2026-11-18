with graded as (
  select
    toString(properties.$ai_evaluation_name) as judge,
    toString(properties.$ai_evaluation_result) as result,
    toString(properties.$ai_evaluation_skipped) = 'true' as skipped
  from events
  where event = '$ai_evaluation'
    and timestamp > now() - interval __DAYS__ day
    and toString(properties.$ai_evaluation_result) in ('true', 'false')
)
select
  judge,
  countIf(not skipped) as graded,
  countIf(not skipped and result = 'false') as failed,
  round(countIf(not skipped and result = 'false') / countIf(not skipped) * 100, 1) as failed_pct,
  countIf(skipped) as skipped
from graded
group by judge
order by failed_pct desc
