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

export const sentry = {
  initialize,
  capture,
  isInitialized: () => initialized,
};
