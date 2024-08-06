import { api } from '@/lib/api';
import { SeekPage } from '@activepieces/shared';

export const alertsApi = {
  create(request: any): Promise<Alert> {
    return api.post<any>('/v1/alerts', request);
  },
  list(request: any): Promise<SeekPage<Alert>> {
    return api.get<SeekPage<Alert>>('/v1/alerts', request);
  },
  delete(alertId: string): Promise<void> {
    return api.delete<void>(`/v1/alerts/${alertId}`);
  },
};
