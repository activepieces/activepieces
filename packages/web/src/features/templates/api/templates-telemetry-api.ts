import { TemplateTelemetryEvent } from '@activepieces/shared';

import { api } from '@/lib/api';

export const templatesTelemetryApi = {
  sendEvent(event: TemplateTelemetryEvent) {
    return api.post<void>(`/v1/templates-telemetry/event`, event);
  },
};
