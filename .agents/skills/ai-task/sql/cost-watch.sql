select
  toDate(Timestamp) as day,
  LogAttributes['version'] as version,
  count() as turns,
  round(countIf(LogAttributes['outcome'] != 'success') / count() * 100, 1) as failed_pct,
  round(avg(toUInt64OrZero(LogAttributes['inputTokens']))) as avg_input,
  round(avg(toUInt64OrZero(LogAttributes['cacheWriteTokens']))) as avg_cache_write,
  round(sum(toUInt64OrZero(LogAttributes['cacheReadTokens'])) / sum(toUInt64OrZero(LogAttributes['inputTokens'])) * 100, 1) as cache_read_pct
from default.otel_logs
where Timestamp > now() - interval __DAYS__ day
  and LogAttributes['job.type'] = 'EXECUTE_AGENT_RUN'
  and LogAttributes['agentRun.source'] = 'CHAT'
  and mapContains(LogAttributes, 'outcome')
group by day, version
order by day, version
