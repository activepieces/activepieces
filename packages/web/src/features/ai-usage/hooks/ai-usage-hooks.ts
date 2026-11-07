import { isNil } from '@activepieces/core-utils';
import {
  AiUsageDimension,
  AiUsagePeriod,
  AiUsageScope,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { platformHooks } from '@/hooks/platform-hooks';

import { aiUsageApi } from '../api/ai-usage-api';

function staleTimeMsFor({ period }: { period: AiUsagePeriod }): number {
  return PERIOD_STALE_TIME_SECONDS[period] * 1000;
}

function listStaleTimeMsFor({ period }: { period: AiUsagePeriod }): number {
  return Math.min(staleTimeMsFor({ period }), LIST_AND_DETAIL_MAX_STALE_MS);
}

export const aiUsageHooks = {
  useUsageOverview: ({
    period,
    scope,
  }: {
    period: AiUsagePeriod;
    scope: AiUsageScope;
  }) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: ['ai-usage-overview', period, scope],
      queryFn: () => aiUsageApi.getOverview({ period, scope }),
      enabled: platform.plan.aiProvidersEnabled,
      staleTime: staleTimeMsFor({ period }),
    });
  },
  useUsageItems: ({
    dimension,
    period,
    scope,
  }: {
    dimension: AiUsageDimension | undefined;
    period: AiUsagePeriod;
    scope: AiUsageScope;
  }) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: ['ai-usage-items', dimension, period, scope],
      queryFn: () => {
        if (isNil(dimension)) {
          return Promise.reject(new Error('missing dimension'));
        }
        return aiUsageApi.getItems({ dimension, period, scope });
      },
      enabled: platform.plan.aiProvidersEnabled && !isNil(dimension),
      staleTime: listStaleTimeMsFor({ period }),
    });
  },
  useUsageDetail: ({
    dimension,
    id,
    period,
    scope,
  }: {
    dimension: AiUsageDimension | undefined;
    id: string | undefined;
    period: AiUsagePeriod;
    scope: AiUsageScope;
  }) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: ['ai-usage-detail', dimension, id, period, scope],
      queryFn: () => {
        if (isNil(dimension) || isNil(id)) {
          return Promise.reject(new Error('missing dimension or id'));
        }
        return aiUsageApi.getDetail({ dimension, id, period, scope });
      },
      enabled:
        platform.plan.aiProvidersEnabled && !isNil(dimension) && !isNil(id),
      staleTime: listStaleTimeMsFor({ period }),
    });
  },
};

const PERIOD_STALE_TIME_SECONDS: Record<AiUsagePeriod, number> = {
  '1h': 60,
  '6h': 60,
  '12h': 120,
  '24h': 120,
  '7d': 300,
  '30d': 600,
  '90d': 900,
  'this-month': 600,
  'last-month': 3600,
};
const LIST_AND_DETAIL_MAX_STALE_MS = 5 * 60 * 1000;
