import { api } from '@/lib/api';
import {
  Alert,
  CreateAlertParams,
  ListAlertsParams,
  UpdateAlertParams,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const alertsApi = {
  create(request: CreateAlertParams ): Promise<Alert> {
    return api.post<Alert>('/v1/alerts', request);
  },
  update(id: string, request: UpdateAlertParams): Promise<Alert> {
    return api.patch<Alert>(`/v1/alerts/${id}`, request);
  },
  list(request: ListAlertsParams): Promise<SeekPage<Alert>> {
    return api.get<SeekPage<Alert>>('/v1/alerts', request);
  },
  delete(alertId: string): Promise<void> {
    return api.delete<void>(`/v1/alerts/${alertId}`);
  },
};
