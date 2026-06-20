import React, { ComponentType } from 'react';

import { errorReporting } from './error-reporting';

const RELOAD_FLAG_PREFIX = 'ap-chunk-reload-';

function reloadOnce(key: string): boolean {
  const flagKey = `${RELOAD_FLAG_PREFIX}${key}`;
  if (sessionStorage.getItem(flagKey)) {
    return false;
  }
  sessionStorage.setItem(flagKey, '1');
  window.location.reload();
  return true;
}

function clearReloadFlag(key: string): void {
  sessionStorage.removeItem(`${RELOAD_FLAG_PREFIX}${key}`);
}

async function retryChunkImport<T extends ComponentType<unknown>>({
  factory,
  key,
}: {
  factory: () => Promise<{ default: T }>;
  key: string;
}): Promise<{ default: T }> {
  try {
    const module = await factory();
    clearReloadFlag(key);
    return module;
  } catch (error) {
    if (errorReporting.isChunkLoadError(error) && reloadOnce(key)) {
      return new Promise<{ default: T }>(() => {});
    }
    throw error;
  }
}

export const lazyWithRetry = <T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  key: string,
) => React.lazy(() => retryChunkImport({ factory, key }));

export const reloadOnceForStaleChunk = (key: string) => reloadOnce(key);
