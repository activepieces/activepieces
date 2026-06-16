import * as Sentry from '@sentry/react';

let initialized = false;

function initialize({
  dsn,
  environment,
  release,
}: {
  dsn: string | undefined | null;
  environment?: string;
  release?: string;
}): void {
  if (!dsn || initialized) {
    return;
  }
  initialized = true;
  Sentry.init({
    dsn,
    environment,
    release,
    beforeSend: (event) => {
      const value = event?.exception?.values?.[0]?.value;
      if (value && ['EXECUTION_TIMEOUT', 'ENTITY_NOT_FOUND'].includes(value)) {
        return null;
      }
      return event;
    },
  });
}

function capture(
  error: unknown,
  context?: Parameters<typeof Sentry.captureException>[1],
): void {
  if (!initialized) {
    return;
  }
  Sentry.captureException(error, context);
}

function setUser(user: Sentry.User | null): void {
  if (!initialized) {
    return;
  }
  Sentry.setUser(user);
}

export const sentry = {
  initialize,
  capture,
  setUser,
  isInitialized: () => initialized,
};
