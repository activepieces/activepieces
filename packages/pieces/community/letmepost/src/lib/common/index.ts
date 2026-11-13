import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { letmepostAuth, LetmepostAuth } from './auth';
import { letmepostClient } from './client';

async function listAccounts({ auth, profileId }: { auth: LetmepostAuth; profileId?: string }): Promise<Account[]> {
  const body = await letmepostClient.request<{ data?: unknown }>({
    auth,
    method: HttpMethod.GET,
    path: '/v1/accounts',
    query: { profileId },
    operation: 'list the connected accounts',
  });
  return Array.isArray(body?.data) ? body.data.filter(isAccount) : [];
}

async function getAccount({ auth, accountId }: { auth: LetmepostAuth; accountId: unknown }): Promise<Account> {
  const body = await letmepostClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/v1/accounts/${letmepostClient.segment({ value: accountId, label: 'Account' })}`,
    operation: 'get the account',
  });
  if (!isAccount(body)) {
    throw new Error('letmepost returned an account without an id or platform.');
  }
  return body;
}

async function accountOptions({ auth, platforms }: { auth: LetmepostAuth | undefined; platforms?: string[] }) {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your letmepost account first' };
  }
  try {
    const accounts = await listAccounts({ auth });
    const matching = platforms === undefined ? accounts : accounts.filter((account) => platforms.includes(account.platform));
    return {
      disabled: false,
      options: matching.map((account) => ({
        label: `${account.displayName ?? account.platform} (${account.platform})`,
        value: account.id,
      })),
      placeholder: matching.length === 0 ? 'No matching connected accounts. Connect one in the letmepost dashboard.' : undefined,
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: error instanceof Error ? error.message.slice(0, 300) : 'Could not load accounts from letmepost.',
    };
  }
}

function accountDropdown({ displayName, description, platforms }: { displayName: string; description: string; platforms?: string[] }) {
  return Property.Dropdown({
    displayName,
    description,
    refreshers: ['auth'],
    required: true,
    auth: letmepostAuth,
    options: async ({ auth }) => accountOptions({ auth, platforms }),
  });
}

function mediaProperty() {
  return Property.Array({
    displayName: 'Media',
    description:
      'Media attachments. Give each item a public URL or an existing letmepost media ID, not both.',
    required: false,
    properties: {
      kind: Property.StaticDropdown({
        displayName: 'Type',
        required: true,
        options: {
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
          ],
        },
      }),
      url: Property.ShortText({
        displayName: 'URL',
        description: 'Public URL of the media. Use this or Media ID.',
        required: false,
      }),
      mediaId: Property.ShortText({
        displayName: 'Media ID',
        description:
          'ID of a media asset already uploaded to letmepost. Use this or URL.',
        required: false,
      }),
      altText: Property.ShortText({
        displayName: 'Alt text',
        description: 'Accessibility description for the media.',
        required: false,
      }),
    },
  });
}

function cleanMedia(media: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(media) || media.length === 0) return undefined;
  return media.filter(letmepostClient.isRecord).map((item, index) => {
    const url = letmepostClient.optionalText(item['url']);
    const mediaId = letmepostClient.optionalText(item['mediaId']);
    const altText = letmepostClient.optionalText(item['altText']);
    if (url !== undefined && mediaId !== undefined) {
      throw new Error(`Media item ${index + 1} has both a URL and a Media ID. Give only one.`);
    }
    if (url === undefined && mediaId === undefined) {
      throw new Error(`Media item ${index + 1} needs a URL or a Media ID.`);
    }
    return {
      kind: item['kind'],
      ...(url !== undefined ? { url } : {}),
      ...(mediaId !== undefined ? { mediaId } : {}),
      ...(altText !== undefined ? { altText } : {}),
    };
  });
}

async function createPost({ auth, body, idempotencyKey }: { auth: LetmepostAuth; body: Record<string, unknown>; idempotencyKey?: string }): Promise<Record<string, unknown>> {
  const key = letmepostClient.optionalText(idempotencyKey);
  if (key !== undefined && key.length > 128) {
    throw new Error('Idempotency key must be 128 characters or fewer.');
  }
  const response = await letmepostClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/v1/posts',
    body,
    headers: key !== undefined ? { 'Idempotency-Key': key } : undefined,
    operation: 'publish the post',
  });
  if (letmepostClient.isFailedBatch(response)) {
    throw letmepostClient.batchFailureError(response);
  }
  return letmepostClient.withPostIds(response);
}

async function publishToAccounts({
  auth,
  accountIds,
  text,
  media,
  firstComment,
  scheduledAt,
  profileId,
  idempotencyKey,
  pinterest,
}: PublishParams): Promise<Record<string, unknown>> {
  if (accountIds.length === 0) {
    throw new Error('Select at least one account to publish to.');
  }
  if (accountIds.length > 25) {
    throw new Error('letmepost accepts at most 25 accounts per post.');
  }
  const cleanedMedia = cleanMedia(media);
  const commentText = letmepostClient.optionalText(firstComment);
  const profile = letmepostClient.optionalText(profileId);
  const body: Record<string, unknown> = {
    targets: await buildTargets({ auth, accountIds, pinterestOptions: pinterestOptionsOf(pinterest) }),
    ...(scheduledAt === undefined ? { publishNow: true } : { scheduledAt }),
    ...(text ? { text } : {}),
    ...(cleanedMedia !== undefined ? { media: cleanedMedia } : {}),
    ...(commentText !== undefined ? { firstComment: { text: commentText } } : {}),
    ...(profile !== undefined ? { profileId: profile } : {}),
  };
  return createPost({ auth, body, idempotencyKey });
}

async function buildTargets({ auth, accountIds, pinterestOptions }: { auth: LetmepostAuth; accountIds: string[]; pinterestOptions: Record<string, string> | undefined }): Promise<Record<string, unknown>[]> {
  if (pinterestOptions === undefined) {
    return accountIds.map((accountId) => ({ accountId }));
  }
  const known = await listAccounts({ auth });
  const platformById = new Map(known.map((account) => [account.id, account.platform]));
  return accountIds.map((accountId) =>
    platformById.get(accountId) === 'pinterest'
      ? { accountId, options: { platform: 'pinterest', ...pinterestOptions } }
      : { accountId }
  );
}

function pinterestOptionsOf(values: PinterestValues | undefined): Record<string, string> | undefined {
  const entries = Object.entries(values ?? {})
    .map(([key, value]): [string, string | undefined] => [key, letmepostClient.optionalText(value)])
    .filter((entry): entry is [string, string] => entry[1] !== undefined);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function isAccount(value: unknown): value is Account {
  return (
    letmepostClient.isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['platform'] === 'string'
  );
}

export const letmepostCommon = {
  accountsDropdown: Property.MultiSelectDropdown({
    displayName: 'Accounts',
    description: 'The connected accounts to publish to',
    refreshers: ['auth'],
    required: true,
    auth: letmepostAuth,
    options: async ({ auth }) => accountOptions({ auth }),
  }),
  accountDropdown,
  mediaProperty,
  cleanMedia,
  createPost,
  publishToAccounts,
  listAccounts,
  getAccount,
  PLATFORM_OPTIONS: [
    { label: 'Bluesky', value: 'bluesky' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'Pinterest', value: 'pinterest' },
    { label: 'Threads', value: 'threads' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'X (Twitter)', value: 'twitter' },
  ],
  POST_STATUS_OPTIONS: [
    { label: 'Queued', value: 'queued' },
    { label: 'Validated', value: 'validated' },
    { label: 'Publishing', value: 'publishing' },
    { label: 'Published', value: 'published' },
    { label: 'Failed', value: 'failed' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Canceled', value: 'canceled' },
  ],
};

export type Account = {
  id: string;
  platform: string;
  displayName?: string | null;
  [key: string]: unknown;
};

export type { LetmepostAuth } from './auth';

type PinterestValues = {
  boardId?: unknown;
  title?: unknown;
  destinationUrl?: unknown;
  coverImageUrl?: unknown;
};

type PublishParams = {
  auth: LetmepostAuth;
  accountIds: string[];
  text?: string;
  media?: unknown;
  firstComment?: unknown;
  scheduledAt: string | undefined;
  profileId?: unknown;
  idempotencyKey?: string;
  pinterest?: PinterestValues;
};
