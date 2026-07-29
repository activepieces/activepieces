const TERMINAL_STATUSES: ReadonlySet<string> = new Set(['completed', 'failed', 'partial']);

function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

export const polotnoConstants = {
  BASE_URL: (process.env['AP_POLOTNO_BASE_URL'] ?? 'https://api.studio.polotno.com').replace(/\/+$/, ''),
  TERMINAL_STATUSES,
  isTerminal,
  IMAGE_FORMATS: ['png', 'jpeg', 'pdf'] as const,
  VIDEO_FORMATS: ['mp4', 'gif'] as const,
  TEXT_OVERFLOW_MODES: ['shrink', 'grow', 'truncate'] as const,
  DEFAULT_MAX_WAIT_SECONDS: 120,
  MAX_MAX_WAIT_SECONDS: 600,
  POLL_INITIAL_DELAY_MS: 2_000,
  POLL_MAX_DELAY_MS: 10_000,
  POLL_BACKOFF_FACTOR: 1.5,
  RETRY_AFTER_CAP_SECONDS: 60,
  MAX_RATE_LIMIT_RETRIES: 3,
  TEMPLATE_PAGE_SIZE: 100,
  DEFAULT_MAX_TEMPLATE_RESULTS: 100,
  MAX_TEMPLATE_RESULTS: 1000,
};
