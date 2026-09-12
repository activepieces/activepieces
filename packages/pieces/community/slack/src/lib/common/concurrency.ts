import { WebClientOptions } from '@slack/web-api';

async function mapWithConcurrency<TItem, TResult>({
  items,
  limit,
  handler,
  deadline,
}: {
  items: TItem[];
  limit: number;
  handler: (params: { item: TItem; index: number }) => Promise<TResult>;
  deadline?: {
    at: number;
    onExceeded: (params: { item: TItem; index: number }) => TResult;
  };
}): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length);
  const workerCount = Math.min(limit, items.length);
  let cursor = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];

      results[index] =
        deadline !== undefined && Date.now() >= deadline.at
          ? deadline.onExceeded({ item, index })
          : await handler({ item, index });
    }
  });

  await Promise.all(workers);

  return results;
}

function clampConcurrencyLimit(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_ACTION_CONCURRENCY_LIMIT;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Concurrency must be a number between ${MIN_ACTION_CONCURRENCY_LIMIT} and ${MAX_ACTION_CONCURRENCY_LIMIT}.`,
    );
  }

  const floored = Math.floor(parsed);

  if (floored < MIN_ACTION_CONCURRENCY_LIMIT) {
    return MIN_ACTION_CONCURRENCY_LIMIT;
  }

  if (floored > MAX_ACTION_CONCURRENCY_LIMIT) {
    return MAX_ACTION_CONCURRENCY_LIMIT;
  }

  return floored;
}

function boundedClientOptions(): WebClientOptions {
  return {
    timeout: SLACK_REQUEST_TIMEOUT_MS,
    retryConfig: {
      retries: SLACK_RETRY_ATTEMPTS,
      factor: SLACK_RETRY_FACTOR,
      minTimeout: SLACK_RETRY_MIN_TIMEOUT_MS,
      maxTimeout: SLACK_RETRY_MAX_TIMEOUT_MS,
      randomize: true,
    },
  };
}

function worstCaseMsPerRecipient(): number {
  const backoffMs = Array.from({ length: SLACK_RETRY_ATTEMPTS }, (_unused, attempt) =>
    Math.min(
      RETRY_RANDOMIZE_CEILING * SLACK_RETRY_MIN_TIMEOUT_MS * SLACK_RETRY_FACTOR ** attempt,
      SLACK_RETRY_MAX_TIMEOUT_MS,
    ),
  ).reduce((total, backoff) => total + backoff, 0);

  return SLACK_REQUEST_TIMEOUT_MS * (SLACK_RETRY_ATTEMPTS + 1) + backoffMs;
}

function sendBudgetMs(): number {
  return FLOW_TIMEOUT_DEFAULT_MS - FLOW_BUDGET_HEADROOM_MS;
}

function roundsWithinFlowBudget(): number {
  return Math.floor(sendBudgetMs() / worstCaseMsPerRecipient());
}

export const slackConcurrency = {
  mapWithConcurrency,
  clampConcurrencyLimit,
  boundedClientOptions,
  worstCaseMsPerRecipient,
  sendBudgetMs,
  roundsWithinFlowBudget,
};

export const SLACK_REQUEST_TIMEOUT_MS = 10_000;
export const SLACK_RETRY_ATTEMPTS = 2;
export const SLACK_RETRY_FACTOR = 2;
export const SLACK_RETRY_MIN_TIMEOUT_MS = 1_000;
export const SLACK_RETRY_MAX_TIMEOUT_MS = 4_000;

export const FLOW_TIMEOUT_DEFAULT_MS = 600_000;
export const FLOW_BUDGET_HEADROOM_MS = 24_000;

export const MIN_ACTION_CONCURRENCY_LIMIT = 1;
export const DEFAULT_ACTION_CONCURRENCY_LIMIT = 5;
export const MAX_ACTION_CONCURRENCY_LIMIT = 20;

const RETRY_RANDOMIZE_CEILING = 2;
