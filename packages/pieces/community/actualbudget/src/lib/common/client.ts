import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export class ActualBudgetError extends Error {
  constructor(message: string, public readonly reason?: string) {
    super(message);
    this.name = 'ActualBudgetError';
  }
}

const LOCK_WAIT_MS = 120_000;
let lockTail: Promise<void> = Promise.resolve();

async function acquireLock(waitMs: number): Promise<() => void> {
  let release!: () => void;
  const mine = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = lockTail;
  lockTail = previous.then(() => mine);
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new ActualBudgetError(
            `Another Actual Budget step in this worker is still running after ${Math.round(
              waitMs / 1000
            )} s. Try again in a moment.`,
            'lock-timeout'
          )
        ),
      waitMs
    );
  });
  try {
    await Promise.race([previous, timeout]);
  } catch (error) {
    previous.then(release).catch(() => undefined);
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return release;
}

let sdkPromise: Promise<ActualApi> | undefined;

function loadSdk(): Promise<ActualApi> {
  sdkPromise ??= import('@actual-app/api');
  return sdkPromise;
}

export function normalizeServerUrl(raw: string): string {
  const trimmed = (raw ?? '').trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ActualBudgetError(
      'Server URL must be a full URL such as https://actual.example.com or http://localhost:5006.',
      'invalid-url'
    );
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ActualBudgetError(
      'Server URL must start with http:// or https://.',
      'invalid-url'
    );
  }
  if (url.username !== '' || url.password !== '') {
    throw new ActualBudgetError(
      'Server URL must not contain a user name or password. Put the server password in the Password field.',
      'invalid-url'
    );
  }
  if (url.search !== '' || url.hash !== '') {
    throw new ActualBudgetError(
      'Server URL must not contain a query string or #fragment.',
      'invalid-url'
    );
  }
  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

export function mapSdkError({
  error,
  serverUrl,
}: {
  error: unknown;
  serverUrl: string;
}): Error {
  if (error instanceof ActualBudgetError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('invalid-password')) {
    return new ActualBudgetError(
      'The Actual server rejected the password. Check the Password field of the connection.',
      'invalid-password'
    );
  }
  if (message.includes('network-failure')) {
    return new ActualBudgetError(
      `Could not reach the Actual server at ${serverUrl}. Check the Server URL and that the server is running.`,
      'network-failure'
    );
  }
  if (/Budget ".*" not found/.test(message)) {
    return new ActualBudgetError(
      'No budget with this Sync ID was found on the server. Copy the Sync ID from Settings → Show advanced settings.',
      'budget-not-found'
    );
  }
  if (/decrypt|encryption key|password.*encrypt/i.test(message)) {
    return new ActualBudgetError(
      `Could not open the end-to-end encrypted budget: ${message}. Check the End-to-end encryption password.`,
      'decrypt-failure'
    );
  }
  return error instanceof Error ? error : new Error(message);
}

export async function withBudget<T>({
  auth,
  fn,
}: {
  auth: ActualAuthProps;
  fn: (api: ActualApi) => Promise<T>;
}): Promise<T> {
  const serverURL = normalizeServerUrl(auth.server_url);
  const syncId = (auth.sync_id ?? '').trim();
  if (syncId === '') {
    throw new ActualBudgetError(
      'Sync ID is empty. Copy it from Settings → Show advanced settings.',
      'invalid-sync-id'
    );
  }
  const release = await acquireLock(LOCK_WAIT_MS);
  let dataDir: string | undefined;
  let api: ActualApi | undefined;
  try {
    api = await loadSdk();
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ap-actual-'));
    await api.init({ dataDir, serverURL, password: auth.password });
    await api.downloadBudget(syncId, {
      password: auth.encryption_password || undefined,
    });
    return await fn(api);
  } catch (error) {
    throw mapSdkError({ error, serverUrl: serverURL });
  } finally {
    if (api) {
      await api.shutdown().catch(() => undefined);
    }
    if (dataDir) {
      await fs
        .rm(dataDir, { recursive: true, force: true })
        .catch(() => undefined);
    }
    release();
  }
}

type ActualApi = typeof import('@actual-app/api');

export type ActualAuthProps = {
  server_url: string;
  password: string;
  sync_id: string;
  encryption_password?: string;
};

export type { ActualApi };
