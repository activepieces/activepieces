import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoClient, ShortIoAuthValue } from './client';
import { shortIoLinks } from './links';
import { shortIoValues } from './values';

const CHART_INTERVALS = ['hour', 'day', 'week', 'month'];

function chartInterval(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!CHART_INTERVALS.includes(String(value))) {
    throw new Error(`Chart interval must be one of: ${CHART_INTERVALS.join(', ')}.`);
  }
  return String(value);
}

async function domainStatistics({ auth, domainId, period, startDate, endDate, tz, clicksChartInterval, ignoreDatesForPresets }: StatsInput & {
  ignoreDatesForPresets?: boolean;
  domainId: number;
  clicksChartInterval?: unknown;
}): Promise<Record<string, unknown>> {
  const query = {
    ...shortIoValues.statsRange({ period, startDate, endDate, ignoreDatesForPresets }),
    tz: shortIoValues.validateTimezone(tz),
    clicksChartInterval: chartInterval(clicksChartInterval),
  };
  try {
    const response = await shortIoClient.request({
      auth,
      method: HttpMethod.GET,
      base: 'stats',
      path: `/domain/${shortIoClient.domainIdSeg(domainId)}`,
      query,
    });
    return shortIoLinks.isRecord(response) ? response : {};
  } catch (error) {
    return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Domain not found or it has no statistics access.', 400: 'Short.io rejected the statistics period.' } });
  }
}

async function statsQuery({ auth, domainId, report, body }: { auth: ShortIoAuthValue; domainId: number; report: 'top' | 'last_clicks'; body: Record<string, unknown> }): Promise<unknown> {
  return shortIoClient.request({
    auth,
    method: HttpMethod.POST,
    base: 'stats',
    path: `/domain/${shortIoClient.domainIdSeg(domainId)}/${report}`,
    body,
  });
}

export const shortIoStats = { domainStatistics, chartInterval, statsQuery };

type StatsInput = {
  auth: ShortIoAuthValue;
  period: unknown;
  startDate?: string;
  endDate?: string;
  tz?: string;
};
