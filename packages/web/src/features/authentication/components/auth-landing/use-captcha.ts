import { isNil } from '@activepieces/core-utils';
import { TelemetryEventName } from '@activepieces/shared';
import { useCallback, useState } from 'react';

import { useTelemetry } from '@/components/providers/telemetry-provider';

import { useTurnstileSiteKey } from './turnstile-widget';

export function useCaptcha({ surface }: UseCaptchaParams) {
  const { capture } = useTelemetry();
  const siteKey = useTurnstileSiteKey();
  const [token, setToken] = useState<string | undefined>();
  const [resetSignal, setResetSignal] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  const onUnavailable = useCallback(() => {
    setUnavailable(true);
    capture({
      name: TelemetryEventName.CAPTCHA_UNAVAILABLE,
      payload: { surface },
    });
  }, [capture, surface]);

  const take = useCallback(() => {
    setToken(undefined);
    setResetSignal((count) => count + 1);
    return token;
  }, [token]);

  const required = !isNil(siteKey) && !unavailable;

  return {
    token,
    blocked: required && isNil(token),
    take,
    widgetProps: { onToken: setToken, onUnavailable, resetSignal },
  };
}

type UseCaptchaParams = {
  surface: string;
};

export type Captcha = ReturnType<typeof useCaptcha>;
