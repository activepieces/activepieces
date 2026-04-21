import { RATE_LIMIT_WINDOW_SECONDS } from '@activepieces/shared';
import { t } from 'i18next';
import { useCallback, useEffect, useState } from 'react';

function use2faRateLimit({
  fallbackMessage,
}: { fallbackMessage?: string } = {}) {
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter > 0]);

  const handleRateLimitOrError = useCallback(
    (
      error: { status?: number } | null,
      setError: (msg: string | null) => void,
    ) => {
      if (error?.status === 429) {
        setRetryAfter(RATE_LIMIT_WINDOW_SECONDS);
        setError(null);
        return;
      }
      if (isSessionExpiredError(error)) {
        setError(getSessionExpiredMessage());
        return;
      }
      setError(fallbackMessage ?? t('Invalid code. Please try again.'));
    },
    [fallbackMessage],
  );

  const rateLimitMessage =
    retryAfter > 0
      ? t(
          'Too many attempts. Try again in {seconds, plural, =1 {1 second} other {# seconds}}.',
          { seconds: retryAfter },
        )
      : null;

  return {
    retryAfter,
    isRateLimited: retryAfter > 0,
    rateLimitMessage,
    handleRateLimitOrError,
  };
}

function isSessionExpiredError(
  error: { status?: number } | null | undefined,
): boolean {
  return error?.status === 401;
}

function getSessionExpiredMessage(): string {
  return t('Your session has expired. Please sign out and sign in again.');
}

export { use2faRateLimit, isSessionExpiredError, getSessionExpiredMessage };
