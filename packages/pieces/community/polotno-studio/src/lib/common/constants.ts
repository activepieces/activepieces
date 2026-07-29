import type { RenderStatus } from './types';

export const BASE_URL = (process.env['AP_POLOTNO_BASE_URL'] ?? 'https://api.studio.polotno.com').replace(/\/+$/, '');

export const TERMINAL_STATUSES: ReadonlySet<RenderStatus> = new Set(['completed', 'failed', 'partial']);

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status as RenderStatus);
}

export const IMAGE_FORMATS = ['png', 'jpeg', 'pdf'] as const;
export const VIDEO_FORMATS = ['mp4', 'gif'] as const;
export const TEXT_OVERFLOW_MODES = ['shrink', 'grow', 'truncate'] as const;

export const DEFAULT_MAX_WAIT_SECONDS = 120;
export const MAX_MAX_WAIT_SECONDS = 600;

export const POLL_INITIAL_DELAY_MS = 2_000;
export const POLL_MAX_DELAY_MS = 10_000;
export const POLL_BACKOFF_FACTOR = 1.5;

export const RETRY_AFTER_CAP_SECONDS = 60;
export const MAX_RATE_LIMIT_RETRIES = 3;

export const TEMPLATE_PAGE_SIZE = 100;
export const DEFAULT_MAX_TEMPLATE_RESULTS = 100;
export const MAX_TEMPLATE_RESULTS = 1000;
