import {
  AnalyticsTimePeriod,
  PlatformAnalyticsReport,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const analyticsApi = {
  get(timePeriod?: AnalyticsTimePeriod): Promise<PlatformAnalyticsReport> {
    return api.get<PlatformAnalyticsReport>('/v1/analytics', { timePeriod });
  },
  refresh(): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics/refresh');
  },
  markAsOutdated(): Promise<void> {
    return api.post<void>('/v1/analytics/mark-outdated');
  },
};
