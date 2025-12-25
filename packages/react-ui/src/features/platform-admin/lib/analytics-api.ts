import { api } from '@/lib/api';
import {
  AnalyticsReportRequest,
  PlatformAnalyticsReport,
  UpdatePlatformReportRequest,
  UpdateTimeSavedPerRunRequest,
} from '@activepieces/shared';

export const analyticsApi = {
  get(request?: AnalyticsReportRequest): Promise<PlatformAnalyticsReport> {
    return api.get<PlatformAnalyticsReport>('/v1/analytics', request);
  },
  refresh(): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics/refresh');
  },
  update(
    request: UpdatePlatformReportRequest,
  ): Promise<PlatformAnalyticsReport> {
    return api.post<PlatformAnalyticsReport>('/v1/analytics', request);
  },
  // TODO(@chaker): remove this endpoint after solving the issue with removing project id from the principal
  updateTimeSavedPerRun(request: UpdateTimeSavedPerRunRequest): Promise<void> {
    return api.post<void>('/v1/analytics/time-saved-per-run', request);
  },
};
