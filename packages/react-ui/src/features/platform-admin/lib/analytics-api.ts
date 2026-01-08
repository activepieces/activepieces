import { api } from '@/lib/api';
import {
  PlatformAnalyticsReport,
  UpdatePlatformReportRequest,
} from '@activepieces/shared';

export const analyticsApi = {
  get(timePeriod?: 'weekly' | 'monthly' | '3-months' | 'all-time'): Promise<PlatformAnalyticsReport> {
    const params = timePeriod ? { timePeriod } : undefined;
    return api.get<PlatformAnalyticsReport>('/v1/analytics', params);
  },
  refresh(): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics/refresh');
  },
};
