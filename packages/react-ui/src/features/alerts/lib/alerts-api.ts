import {
  Alert,
  CreateAlertParams,
  ListAlertsParams,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

import { api } from '@/lib/api';

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
