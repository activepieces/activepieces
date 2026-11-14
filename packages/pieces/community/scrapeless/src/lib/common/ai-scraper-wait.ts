import { tryCatch } from '@activepieces/pieces-framework';
import type { aiScraper } from './ai-scraper';

function settings(value: unknown): WaitSettings {
  if (value !== undefined && !isRecord(value)) throw new Error('Wait Settings must be an object.');
  const input = isRecord(value) ? value : {};
  const waitTimeoutSeconds = integer({ input, key: 'wait_timeout_seconds', fallback: 180, min: 30, max: 300 });
  const pollIntervalSeconds = integer({ input, key: 'poll_interval_seconds', fallback: 10, min: 5, max: 60 });
  const maxQueries = integer({ input, key: 'max_queries', fallback: 20, min: 1, max: 60 });
  if (pollIntervalSeconds > waitTimeoutSeconds) {
    throw new Error('Poll Interval must not exceed Wait Timeout.');
  }
  return { waitTimeoutSeconds, pollIntervalSeconds, maxQueries };
}

function integer({ input, key, fallback, min, max }: {
  input: Record<string, unknown>;
  key: string;
  fallback: number;
  min: number;
  max: number;
}): number {
  const value = input[key] === undefined ? fallback : input[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function within<T>({ operation, deadline, expired }: {
  operation: () => Promise<T>;
  deadline: number;
  expired: () => Error;
}): Promise<T> {
  const remaining = deadline - performance.now();
  if (remaining <= 0) throw expired();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      operation(),
      new Promise<never>((...[, reject]) => {
        timer = setTimeout(() => reject(expired()), Math.ceil(remaining));
      }),
    ]);
    if (performance.now() >= deadline) throw expired();
    return value;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function run({ create, query, settings: limits, report = async () => undefined, sanitize = value => value }: {
  create: () => Promise<Task>;
  query: (taskId: string) => Promise<Task>;
  settings: WaitSettings;
  report?: (data: Record<string, unknown>) => Promise<void>;
  sanitize?: (value: string) => string;
}): Promise<WaitResult> {
  const started = performance.now();
  const deadline = started + limits.waitTimeoutSeconds * 1000;
  let latest: Task | undefined;
  let attempts = 0;
  let active = true;
  const elapsed = () => Math.round((performance.now() - started) / 1000 * 1000) / 1000;
  const fail = ({ code, detail }: { code: string; detail: string }) => {
    const taskId = latest ? sanitize(latest.task_id) : null;
    const recovery = taskId
      ? `Task ID: ${taskId}. Use Get Task Result with this ID; do not create a replacement.`
      : 'A task may have been created. Check the Scrapeless dashboard before submitting again.';
    return Object.assign(new Error(sanitize(`${detail} Queries used: ${attempts}. Elapsed seconds: ${elapsed()}. Last status: ${latest?.status ?? 'unknown'}. ${recovery}`)), {
      code,
      task_id: taskId,
      poll_attempts: attempts,
      elapsed_seconds: elapsed(),
      last_status: latest?.status ?? null,
    });
  };
  const expired = () => fail({ code: 'WAIT_TIMEOUT', detail: `Wait Timeout of ${limits.waitTimeoutSeconds} seconds reached.` });
  const progress = async () => {
    if (!latest) return;
    const data = { task_id: sanitize(latest.task_id), status: latest.status, completed: latest.completed, poll_attempts: attempts, elapsed_seconds: elapsed() };
    await tryCatch(() => within({ operation: () => report(data), deadline, expired }));
  };
  try {
    latest = await within({ operation: async () => {
      const created = await create();
      if (active) latest = created;
      return created;
    }, deadline, expired });
    const taskId = latest.task_id;
    if (latest.completed) return { task: latest, poll_attempts: attempts, elapsed_seconds: elapsed() };
    await progress();
    while (true) {
      if (performance.now() >= deadline) throw expired();
      if (attempts >= limits.maxQueries) throw fail({ code: 'QUERY_LIMIT', detail: `Maximum Queries of ${limits.maxQueries} reached.` });
      const result = await within({ operation: () => { attempts++; return query(taskId); }, deadline, expired });
      if (result.task_id !== taskId) throw new Error('The result task ID does not match the created task.');
      latest = result;
      if (latest.completed) return { task: latest, poll_attempts: attempts, elapsed_seconds: elapsed() };
      if (performance.now() >= deadline) throw expired();
      if (attempts >= limits.maxQueries) throw fail({ code: 'QUERY_LIMIT', detail: `Maximum Queries of ${limits.maxQueries} reached.` });
      await progress();
      await new Promise<void>(resolve => setTimeout(resolve, Math.min(limits.pollIntervalSeconds * 1000, Math.max(0, deadline - performance.now()))));
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error.code === 'WAIT_TIMEOUT' || error.code === 'QUERY_LIMIT')) throw error;
    throw fail({ code: 'WAIT_FAILED', detail: sanitize(error instanceof Error ? error.message : 'AI Scraper request failed.') });
  } finally {
    active = false;
  }
}

export const aiScraperWait = { settings, run };

type Task = Awaited<ReturnType<typeof aiScraper.createTask>>;
type WaitSettings = { waitTimeoutSeconds: number; pollIntervalSeconds: number; maxQueries: number };
type WaitResult = { task: Task; poll_attempts: number; elapsed_seconds: number };
