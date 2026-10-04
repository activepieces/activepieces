import { isNil } from '@activepieces/core-utils';
import { TelemetryEventName } from '@activepieces/shared';
import { useEffect } from 'react';
import { useLatest } from 'react-use';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { adminControls } from '@/lib/admin-controls';

export function useAdminControlClicks(page: string) {
  const { capture } = useTelemetry();
  const latestCapture = useLatest(capture);

  useEffect(() => {
    const reportClick = (event: MouseEvent) => {
      const control = controlIdOf(event.target);
      if (isNil(control)) {
        return;
      }
      latestCapture.current({
        name: TelemetryEventName.PLATFORM_ADMIN_CONTROL_CLICKED,
        payload: { control, page },
      });
    };
    document.addEventListener('click', reportClick, true);
    return () => document.removeEventListener('click', reportClick, true);
  }, [page, latestCapture]);
}

function controlIdOf(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }
  return (
    target
      .closest(`[${adminControls.attribute}]`)
      ?.getAttribute(adminControls.attribute) ?? null
  );
}
