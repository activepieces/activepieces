import {
  createAgentSessionFromKeyValue,
  type AgentSession,
  type IntegrationEnv,
  type KeyValueStore,
} from '@atomicmail/agentic-core';
import { StoreScope } from '@activepieces/pieces-framework';

import {
  apiKeyFromProps,
  authEnvFromProps,
  type AtomicmailAuthProps,
} from '../auth';

type StoreContext = {
  store: {
    get<T>(key: string, scope?: StoreScope): Promise<T | null>;
    put<T>(key: string, value: T, scope?: StoreScope): Promise<T>;
    delete(key: string, scope?: StoreScope): Promise<void>;
  };
};

export type SessionContext = StoreContext & {
  auth?: unknown;
  propsValue?: Record<string, unknown>;
};

function storageKey(accountId: string, suffix: string): string {
  return `atomicmail:${accountId}:${suffix}`;
}

export function createKeyValueStore(
  context: StoreContext,
  accountId: string,
): KeyValueStore {
  const scope = StoreScope.PROJECT;
  return {
    async get(key: string): Promise<string | undefined> {
      const value = await context.store.get<string>(
        storageKey(accountId, key),
        scope,
      );
      return value ?? undefined;
    },
    async set(key: string, value: string): Promise<void> {
      await context.store.put(storageKey(accountId, key), value, scope);
    },
    async delete(key: string): Promise<void> {
      await context.store.delete(storageKey(accountId, key), scope);
    },
    async has(key: string): Promise<boolean> {
      const value = await context.store.get<string>(
        storageKey(accountId, key),
        scope,
      );
      return value !== null;
    },
  };
}

function authPropsFromContext(context: { auth?: unknown }): AtomicmailAuthProps {
  if (!context.auth || typeof context.auth !== 'object') {
    return {};
  }
  const auth = context.auth as Record<string, unknown>;
  const nestedProps = auth['props'];
  if (
    nestedProps &&
    typeof nestedProps === 'object' &&
    !Array.isArray(nestedProps)
  ) {
    return nestedProps as AtomicmailAuthProps;
  }
  const direct = {
    api_key: auth['api_key'],
    auth_url: auth['auth_url'],
    api_url: auth['api_url'],
  };
  if (
    direct.api_key !== undefined ||
    direct.auth_url !== undefined ||
    direct.api_url !== undefined
  ) {
    return direct as AtomicmailAuthProps;
  }
  return {};
}

function inlineApiKeyFromContext(context: SessionContext): string | undefined {
  const raw = context.propsValue?.['api_key'];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveApiKey(context: SessionContext): string | undefined {
  const props = authPropsFromContext(context);
  return inlineApiKeyFromContext(context) ?? apiKeyFromProps(props);
}

export async function assertStoredCredentials(
  context: SessionContext,
  accountId: string,
): Promise<void> {
  if (resolveApiKey(context)) return;
  const storage = createKeyValueStore(context, accountId);
  // agentic-core KeyValueCredentialStore uses account:{id}:credentials.json;
  // createKeyValueStore prepends atomicmail:{id}: for Activepieces isolation.
  // Register and this guard share the same effective store key.
  const credentialsKey = `account:${accountId}:credentials.json`;
  const raw = await storage.get(credentialsKey);
  if (!raw) {
    throw new Error(
      `No Atomic Mail credentials for account "${accountId}". ` +
        'Run **Register Inbox** in this project first (Account ID `default`), ' +
        'paste an API key on this step, or attach a connection with an API key.',
    );
  }
}

export async function createSession(
  context: SessionContext,
  accountId = 'default',
): Promise<AgentSession> {
  const props = authPropsFromContext(context);
  const apiKey = resolveApiKey(context);
  const env: IntegrationEnv = authEnvFromProps(props);
  return createAgentSessionFromKeyValue({
    storage: createKeyValueStore(context, accountId),
    accountId,
    env,
    apiKey,
    credentialDir: `activepieces://account/${accountId}`,
  });
}

export function normalizeAccountId(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return 'default';
  }
  return raw.trim();
}
