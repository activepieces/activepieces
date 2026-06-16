import { ApFlagId, isNil } from '@activepieces/shared';

import { FlagsMap } from '@/api/flags-api';
import { queryClient } from '@/app/query-client';

import { authenticationSession } from './authentication-session';
import { sentry } from './sentry';

const CHUNK_LOAD_ERROR_REGEX =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError|Loading chunk \d+ failed/i;

const MAX_BUFFER_SIZE = 20;

const DEDUP_WINDOW_MS = 5000;

const buffer: FrontendErrorReport[] = [];

const recentSignatures = new Map<string, number>();

function isDuplicate(error: Error): boolean {
  const signature = `${error.name}:${error.message}:${
    error.stack?.split('\n')[1] ?? ''
  }`;
  const now = Date.now();
  const lastSeen = recentSignatures.get(signature);
  recentSignatures.set(signature, now);
  if (recentSignatures.size > 50) {
    recentSignatures.delete(recentSignatures.keys().next().value as string);
  }
  return !isNil(lastSeen) && now - lastSeen < DEDUP_WINDOW_MS;
}

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return CHUNK_LOAD_ERROR_REGEX.test(message);
}

function readFlag<T>(flagId: ApFlagId): T | undefined {
  const flags = queryClient.getQueryData<FlagsMap>(['flags']);
  return flags?.[flagId] as T | undefined;
}

function init(): void {
  sentry.initialize({
    dsn: readFlag<string>(ApFlagId.FRONTEND_SENTRY_DSN),
    environment: readFlag<string>(ApFlagId.ENVIRONMENT),
    release: readFlag<string>(ApFlagId.CURRENT_VERSION),
  });
}

function buildCaptureContext(report: FrontendErrorReport) {
  const userId = authenticationSession.getCurrentUserId();
  const projectId = authenticationSession.getProjectId();
  const platformId = authenticationSession.getPlatformId();

  return {
    tags: {
      source: report.source,
      is_chunk_load_error: isChunkLoadError(report.error),
      app_version: readFlag<string>(ApFlagId.CURRENT_VERSION) ?? 'unknown',
      app_environment: readFlag<string>(ApFlagId.ENVIRONMENT) ?? 'unknown',
    },
    user: isNil(userId)
      ? undefined
      : { id: userId, project_id: projectId, platform_id: platformId },
    contexts: {
      page: {
        url: window.location.href,
        pathname: window.location.pathname,
        hash: window.location.hash,
        referrer: document.referrer,
      },
      browser_info: {
        user_agent: navigator.userAgent,
        language: navigator.language,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,
        online: navigator.onLine,
      },
    },
    extra: {
      component_stack: report.componentStack,
    },
  };
}

function send(report: FrontendErrorReport): void {
  const error =
    report.error instanceof Error
      ? report.error
      : new Error(String(report.error ?? 'Unknown error'));
  if (isDuplicate(error)) {
    return;
  }

  console.error('[frontend-error]', error, {
    source: report.source,
    componentStack: report.componentStack,
  });

  init();

  if (!sentry.isInitialized()) {
    if (buffer.length < MAX_BUFFER_SIZE) {
      buffer.push(report);
    }
    return;
  }

  sentry.capture(error, buildCaptureContext(report));
}

function report(input: FrontendErrorReport): void {
  send(input);
}

function flushBuffered(): void {
  init();
  if (!sentry.isInitialized() || buffer.length === 0) {
    return;
  }
  const pending = buffer.splice(0, buffer.length);
  pending.forEach(send);
}

export const errorReporting = {
  init,
  report,
  flushBuffered,
  isChunkLoadError,
};

export type FrontendErrorReport = {
  error: unknown;
  componentStack?: string | null;
  source: FrontendErrorSource;
};

export type FrontendErrorSource =
  | 'react-error-boundary'
  | 'route-error'
  | 'window-error'
  | 'unhandled-rejection'
  | 'chunk-preload';
