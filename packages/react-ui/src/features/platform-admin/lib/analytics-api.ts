import { api } from '@/lib/api';
import {
  PlatformAnalyticsReport,
  UpdatePlatformReportRequest,
} from '@activepieces/shared';

export const analyticsApi = {
  get(): Promise<PlatformAnalyticsReport> {
    return api.get<PlatformAnalyticsReport>('/v1/analytics');
  },
  refresh(): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics/refresh');
  },
  update(
    request: UpdatePlatformReportRequest,
  ): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics', request);
  },
};
