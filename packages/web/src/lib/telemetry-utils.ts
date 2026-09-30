import { tryCatchSync } from '@activepieces/core-utils';
import posthog from 'posthog-js';

import { acquisitionUtils } from './acquisition-utils';

function resetIdentity(): void {
  if (posthog.__loaded) {
    posthog.reset();
  }
  acquisitionUtils.clearAcquisitionParams();
}

function getSessionId(): string | null {
  if (!posthog.__loaded) {
    return null;
  }
  const { data } = tryCatchSync(() => posthog.get_session_id());
  return data !== null && data.length > 0 ? data : null;
}

export const telemetryUtils = {
  resetIdentity,
  getSessionId,
};
