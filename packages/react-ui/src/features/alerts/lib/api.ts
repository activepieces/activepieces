import { api } from '@/lib/api';
import {
  Alert,
  CreateAlertParams,
  ListAlertsParams,
} from '@ensemble/ee-shared';
import { SeekPage } from '@ensemble/shared';

export const alertsApi = {
  create(request: CreateAlertParams): Promise<Alert> {
    return api.post<Alert>('/v1/alerts', request);
  },
  list(request: ListAlertsParams): Promise<SeekPage<Alert>> {
    return api.get<SeekPage<Alert>>('/v1/alerts', request);
  },
  delete(alertId: string): Promise<void> {
    return api.delete<void>(`/v1/alerts/${alertId}`);
  },
};
