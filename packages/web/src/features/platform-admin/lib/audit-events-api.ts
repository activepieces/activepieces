import {
  ApplicationEvent,
  ListAuditEventsRequest,
} from '@activepieces/shared';
import { SeekPage } from '@activepieces/shared';

import { api } from '@/lib/api';

export const auditEventsApi = {
  list(request: ListAuditEventsRequest) {
    return api.get<SeekPage<ApplicationEvent>>('/v1/audit-events', request);
  },
};
