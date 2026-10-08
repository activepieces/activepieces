select
  toDate(Timestamp) as day,
  LogAttributes['version'] as version,
  count() as turns,
  round(countIf(LogAttributes['outcome'] != 'success') / count() * 100, 1) as failed_pct,
  countIf(not mapContains(LogAttributes, 'inputTokens')) as turns_without_tokens,
  round(avgIf(toUInt64OrZero(LogAttributes['inputTokens']), mapContains(LogAttributes, 'inputTokens'))) as avg_input,
  round(avgIf(toUInt64OrZero(LogAttributes['cacheWriteTokens']), mapContains(LogAttributes, 'cacheWriteTokens'))) as avg_cache_write,
  round(sumIf(toUInt64OrZero(LogAttributes['cacheReadTokens']), mapContains(LogAttributes, 'inputTokens')) / sumIf(toUInt64OrZero(LogAttributes['inputTokens']), mapContains(LogAttributes, 'inputTokens')) * 100, 1) as cache_read_pct
from default.otel_logs
where Timestamp > now() - interval __DAYS__ day
  and LogAttributes['job.type'] = 'EXECUTE_AGENT_RUN'
  and LogAttributes['agentRun.source'] = 'CHAT'
  and mapContains(LogAttributes, 'outcome')
group by day, version
order by day, version
