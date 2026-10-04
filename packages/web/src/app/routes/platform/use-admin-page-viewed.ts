import { TelemetryEventName } from '@activepieces/shared';
import { useEffect } from 'react';
import { useLatest } from 'react-use';

import { useInsideFeatureSample } from '@/app/components/feature-sample';
import { useTelemetry } from '@/components/providers/telemetry-provider';

export function useAdminPageViewed(page: string) {
  const { capture } = useTelemetry();
  const latestCapture = useLatest(capture);
  const locked = useInsideFeatureSample();

  useEffect(() => {
    latestCapture.current({
      name: TelemetryEventName.PLATFORM_ADMIN_PAGE_VIEWED,
      payload: { page, locked },
    });
  }, [latestCapture, page, locked]);
}
