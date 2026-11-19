import crypto from 'node:crypto';
import { isNil, Store, tryCatch } from '@activepieces/pieces-framework';
import { ErrorCode, WebAPIPlatformError, WebClient, WebClientOptions } from '@slack/web-api';
import { getBotToken, getBotUserId, getUserToken, SlackAuthValue } from './auth-helpers';

export async function connectionCanSee({ auth, store, connectedUserId, channel, channelType, eventAuthorizations }: ConnectionCanSeeParams): Promise<boolean> {
  if (eventNamesConnection({ auth, connectedUserId, eventAuthorizations })) {
    return true;
  }
  const cacheKey = buildCacheKey({ auth, connectedUserId, channel });
  const cachedAnswer = await readFreshCachedAnswer({ store, cacheKey, channelType });
  if (!isNil(cachedAnswer)) {
    return cachedAnswer;
  }
  const canSee = await askSlackIfConnectionCanSee({ auth, channel });
  if (cacheLifetimeMs({ channelType, canSee }) > 0) {
    await store.put<CachedAccessAnswer>(cacheKey, { canSee, checkedAt: Date.now() });
  }
  return canSee;
}

function buildCacheKey({ auth, connectedUserId, channel }: {
  auth: SlackAuthValue;
  connectedUserId: string;
  channel: string;
}): string {
  const botIdentity = getBotUserId(auth) ?? crypto.createHash('sha256').update(getBotToken(auth)).digest('hex').slice(0, 16);
  return `conversation-access:${connectedUserId}:${botIdentity}:${channel}`;
}

function cacheLifetimeMs({ channelType, canSee }: { channelType: string; canSee: boolean }): number {
  if (channelType === 'im') {
    return DIRECT_MESSAGE_ANSWER_LIFETIME_MS;
  }
  if (channelType === 'group' && !canSee) {
    return PRIVATE_CHANNEL_NO_ANSWER_LIFETIME_MS;
  }
  return 0;
}

function eventNamesConnection({ auth, connectedUserId, eventAuthorizations }: {
  auth: SlackAuthValue;
  connectedUserId: string;
  eventAuthorizations: SlackEventAuthorization[] | undefined;
}): boolean {
  const connectionSlackIds = [connectedUserId, getBotUserId(auth)];
  return (eventAuthorizations ?? []).some((authorization) =>
    !isNil(authorization.user_id) && connectionSlackIds.includes(authorization.user_id),
  );
}

async function readFreshCachedAnswer({ store, cacheKey, channelType }: {
  store: Store;
  cacheKey: string;
  channelType: string;
}): Promise<boolean | undefined> {
  const cachedAnswer = await store.get<CachedAccessAnswer>(cacheKey);
  if (isNil(cachedAnswer)) {
    return undefined;
  }
  const lifetimeMs = cacheLifetimeMs({ channelType, canSee: cachedAnswer.canSee });
  if (Date.now() - cachedAnswer.checkedAt >= lifetimeMs) {
    return undefined;
  }
  return cachedAnswer.canSee;
}

async function askSlackIfConnectionCanSee({ auth, channel }: { auth: SlackAuthValue; channel: string }): Promise<boolean> {
  if (await botCanSee({ auth, channel })) {
    return true;
  }
  return userCanSee({ auth, channel });
}

async function botCanSee({ auth, channel }: { auth: SlackAuthValue; channel: string }): Promise<boolean> {
  const botClient = new WebClient(getBotToken(auth), SLACK_CLIENT_OPTIONS);
  const infoAnswer = await askSlack(() => botClient.conversations.info({ channel }));
  if (infoAnswer !== 'missingScope') {
    return infoAnswer === 'allowed';
  }
  const historyAnswer = await askSlack(() => botClient.conversations.history({ channel, limit: 1 }));
  return historyAnswer === 'allowed';
}

async function userCanSee({ auth, channel }: { auth: SlackAuthValue; channel: string }): Promise<boolean> {
  const userToken = getUserToken(auth);
  if (isNil(userToken)) {
    return false;
  }
  const userClient = new WebClient(userToken, SLACK_CLIENT_OPTIONS);
  const historyAnswer = await askSlack(() => userClient.conversations.history({ channel, limit: 1 }));
  return historyAnswer === 'allowed';
}

async function askSlack(slackCall: () => Promise<unknown>): Promise<SlackAccessAnswer> {
  const { error } = await tryCatch(slackCall);
  if (isNil(error)) {
    return 'allowed';
  }
  if (!isSlackPlatformError(error)) {
    throw error;
  }
  if (error.data.error === 'missing_scope') {
    return 'missingScope';
  }
  if (SLACK_NO_ACCESS_ERRORS.includes(error.data.error)) {
    return 'denied';
  }
  throw error;
}

function isSlackPlatformError(error: Error): error is WebAPIPlatformError {
  return 'code' in error && error.code === ErrorCode.PlatformError;
}

const SLACK_NO_ACCESS_ERRORS = ['channel_not_found', 'not_in_channel', 'access_denied', 'no_permission'];
const SLACK_CLIENT_OPTIONS: WebClientOptions = { timeout: 5_000, retryConfig: { retries: 0 }, rejectRateLimitedCalls: true };
const DIRECT_MESSAGE_ANSWER_LIFETIME_MS = 24 * 60 * 60 * 1000;
const PRIVATE_CHANNEL_NO_ANSWER_LIFETIME_MS = 2 * 60 * 1000;

type SlackAccessAnswer = 'allowed' | 'denied' | 'missingScope';

type CachedAccessAnswer = {
  canSee: boolean;
  checkedAt: number;
};

type ConnectionCanSeeParams = {
  auth: SlackAuthValue;
  store: Store;
  connectedUserId: string;
  channel: string;
  channelType: string;
  eventAuthorizations: SlackEventAuthorization[] | undefined;
};

export type SlackEventAuthorization = {
  user_id?: string;
};
