import { api } from '@/lib/api';
import {
  PlatformAnalyticsReport,
  UpdatePlatformReportRequest,
} from '@activepieces/shared';

export type TimePeriod = 'weekly' | 'monthly' | 'all-time';

export const analyticsApi = {
  get(timePeriod: TimePeriod = 'monthly'): Promise<PlatformAnalyticsReport> {
    return api.get<PlatformAnalyticsReport>('/v1/analytics', { timePeriod });
  },
  refresh(timePeriod: TimePeriod = 'monthly'): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics/refresh', undefined, {
      timePeriod,
    });
  },
  update(
    request: UpdatePlatformReportRequest,
  ): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics', request);
  },
};
