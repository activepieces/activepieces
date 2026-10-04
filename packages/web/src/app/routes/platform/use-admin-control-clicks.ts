import { isNil } from '@activepieces/core-utils';
import { TelemetryEventName } from '@activepieces/shared';
import { useEffect } from 'react';
import { useLatest } from 'react-use';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { ADMIN_CONTROL_ATTRIBUTE } from '@/lib/admin-control';

export function useAdminControlClicks(page: string) {
  const { capture } = useTelemetry();
  const latestCapture = useLatest(capture);
  const latestPage = useLatest(page);

  useEffect(() => {
    const reportClick = (event: MouseEvent) => {
      const control = controlIdOf(event.target);
      if (isNil(control)) {
        return;
      }
      latestCapture.current({
        name: TelemetryEventName.PLATFORM_ADMIN_CONTROL_CLICKED,
        payload: { control, page: latestPage.current },
      });
    };
    document.addEventListener('click', reportClick, true);
    return () => document.removeEventListener('click', reportClick, true);
  }, [latestCapture, latestPage]);
}

function controlIdOf(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }
  return (
    target.closest(CONTROL_SELECTOR)?.getAttribute(ADMIN_CONTROL_ATTRIBUTE) ??
    null
  );
}

const CONTROL_SELECTOR = `[${ADMIN_CONTROL_ATTRIBUTE}]`;
