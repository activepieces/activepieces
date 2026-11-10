import { Property, Store } from '@activepieces/pieces-framework';
import { bufferAuth } from './auth';
import { bufferClient } from './client';
import { bufferQueries as documents } from './queries';

async function fetchOrganizations(accessToken: string): Promise<Organization[]> {
  const data = await bufferClient.graphql<{
    account: { organizations: Organization[] };
  }>({
    accessToken,
    query: documents.ORGANIZATIONS,
    operation: 'load your organizations',
  });
  return data.account.organizations ?? [];
}

async function fetchChannels({ accessToken, organizationId }: { accessToken: string; organizationId: string }): Promise<Channel[]> {
  const data = await bufferClient.graphql<{ channels: Channel[] }>({
    accessToken,
    query: documents.CHANNELS,
    variables: { organizationId },
    operation: 'load the channels of the organization',
  });
  return data.channels ?? [];
}

async function fetchIdeaGroups({ accessToken, organizationId }: { accessToken: string; organizationId: string }): Promise<IdeaGroup[]> {
  const data = await bufferClient.graphql<{ ideaGroups: IdeaGroup[] }>({
    accessToken,
    query: documents.IDEA_GROUPS,
    variables: { organizationId },
    operation: 'load the idea groups of the organization',
  });
  return data.ideaGroups ?? [];
}

async function fetchNewPosts({
  accessToken,
  organizationId,
  channelIds,
  statuses,
  sortField,
  sortDirection,
  windowField,
  windowStart,
  firstPageOnly,
}: {
  accessToken: string;
  organizationId: string;
  channelIds?: string[];
  statuses: string[];
  sortField: 'createdAt' | 'dueAt';
  sortDirection: 'asc' | 'desc';
  windowField: 'createdAt' | 'dueAt';
  windowStart: string | undefined;
  firstPageOnly: boolean;
}): Promise<BufferPost[]> {
  const filter: Record<string, unknown> = { status: statuses };
  if (channelIds !== undefined && channelIds.length > 0) {
    filter['channelIds'] = channelIds;
  }
  if (windowStart !== undefined) {
    filter[windowField] = { start: windowStart };
  }
  const pages: BufferPost[][] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_TRIGGER_PAGES; page++) {
    const data = await bufferClient.graphql<{
      posts: { edges?: Array<{ node: BufferPost }>; pageInfo: { endCursor?: string | null; hasNextPage: boolean } };
    }>({
      accessToken,
      query: documents.TRIGGER_POSTS,
      variables: {
        input: { organizationId, filter, sort: [{ field: sortField, direction: sortDirection }] },
        first: firstPageOnly ? TEST_PAGE_SIZE : TRIGGER_PAGE_SIZE,
        ...(after === undefined ? {} : { after }),
      },
      operation: 'load posts',
    });
    pages.push((data.posts.edges ?? []).map((edge) => edge.node));
    const next = data.posts.pageInfo.endCursor ?? undefined;
    if (firstPageOnly || !data.posts.pageInfo.hasNextPage || next === undefined) {
      return pages.flat();
    }
    if (next === after) {
      throw new Error('Buffer returned the same page cursor twice while loading posts.');
    }
    after = next;
  }
  return pages.flat();
}

async function startPolling({ store, isRepublish }: { store: Store; isRepublish: boolean | undefined }): Promise<void> {
  if (isRepublish === true) {
    const saved = await store.get<unknown>(CHECKPOINT_KEY);
    const legacy = await store.get<unknown>(LEGACY_LAST_POLL_KEY);
    if (isCheckpoint(saved) || isEpoch(legacy)) {
      return;
    }
  }
  await store.put<PollCheckpoint>(CHECKPOINT_KEY, { epoch: Date.now(), ids: [] });
}

async function readCheckpoint(store: Store): Promise<{ epoch: number; seen: Set<string>; inclusive: boolean }> {
  const saved = await store.get<unknown>(CHECKPOINT_KEY);
  if (isCheckpoint(saved)) {
    return { epoch: saved.epoch, seen: new Set(saved.ids), inclusive: true };
  }
  const legacy = await store.get<unknown>(LEGACY_LAST_POLL_KEY);
  if (isEpoch(legacy)) {
    return { epoch: legacy, seen: new Set(), inclusive: false };
  }
  throw new Error("lastPoll doesn't exist in the store.");
}

async function pollNewPosts({
  store,
  loadPosts,
  epochOf,
}: {
  store: Store;
  loadPosts: (lastPoll: number) => Promise<BufferPost[]>;
  epochOf: (post: BufferPost) => number;
}): Promise<BufferPost[]> {
  const checkpoint = await readCheckpoint(store);
  const posts = await loadPosts(checkpoint.epoch);
  const fresh = [...new Map(posts.map((post) => [post.id, post])).values()].filter((post) => {
    const epoch = epochOf(post);
    return epoch > checkpoint.epoch || (checkpoint.inclusive && epoch === checkpoint.epoch && !checkpoint.seen.has(post.id));
  });
  if (fresh.length === 0) {
    return [];
  }
  const newest = fresh.reduce((acc, post) => Math.max(acc, epochOf(post)), checkpoint.epoch);
  const idsAtNewest = fresh.filter((post) => epochOf(post) === newest).map((post) => post.id);
  await store.put<PollCheckpoint>(CHECKPOINT_KEY, {
    epoch: newest,
    ids: newest === checkpoint.epoch ? [...checkpoint.seen, ...idsAtNewest] : idsAtNewest,
  });
  return fresh;
}

function isEpoch(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCheckpoint(value: unknown): value is PollCheckpoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'epoch' in value &&
    isEpoch(value.epoch) &&
    'ids' in value &&
    Array.isArray(value.ids) &&
    value.ids.every((id: unknown) => typeof id === 'string')
  );
}

function reasonOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 150 ? `${message.slice(0, 150)}…` : message;
}

async function channelOptions({ auth, organizationId }: { auth: { secret_text: string } | undefined; organizationId: unknown }) {
  if (!auth || typeof organizationId !== 'string' || organizationId === '') {
    return {
      disabled: true,
      placeholder: 'Select an organization first.',
      options: [],
    };
  }
  try {
    const channels = await fetchChannels({ accessToken: auth.secret_text, organizationId });
    return {
      disabled: false,
      options: channels.map((channel) => ({
        label: `${channel.name} (${channel.service})`,
        value: channel.id,
      })),
    };
  } catch (error) {
    return {
      disabled: true,
      placeholder: `Failed to load channels: ${reasonOf(error)}`,
      options: [],
    };
  }
}

export const bufferProps = {
  organizationId: () =>
    Property.Dropdown<string, true, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Organization',
      description: 'The Buffer organization to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Buffer account first.',
            options: [],
          };
        }
        try {
          const organizations = await fetchOrganizations(auth.secret_text);
          return {
            disabled: false,
            options: organizations.map((org) => ({
              label: org.name,
              value: org.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: `Failed to load organizations: ${reasonOf(error)}`,
            options: [],
          };
        }
      },
    }),

  channelIds: (required = true) =>
    Property.MultiSelectDropdown<string, boolean, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Channels',
      description: 'The Buffer channels to publish to.',
      required,
      refreshers: ['organizationId'],
      options: async ({ auth, organizationId }) => channelOptions({ auth, organizationId }),
    }),

  channelFilter: () =>
    Property.MultiSelectDropdown<string, false, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Channels',
      description: 'Limit results to specific channels (optional).',
      required: false,
      refreshers: ['organizationId'],
      options: async ({ auth, organizationId }) => channelOptions({ auth, organizationId }),
    }),

  channelId: () =>
    Property.Dropdown<string, true, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Channel',
      description: 'The Buffer channel.',
      required: true,
      refreshers: ['organizationId'],
      options: async ({ auth, organizationId }) => channelOptions({ auth, organizationId }),
    }),

  ideaGroupId: () =>
    Property.Dropdown<string, false, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Idea Group',
      description: 'The column on the Ideas board to add the idea to. Leave empty to keep it out of any column.',
      required: false,
      refreshers: ['organizationId'],
      options: async ({ auth, organizationId }) => {
        if (!auth || typeof organizationId !== 'string' || organizationId === '') {
          return {
            disabled: true,
            placeholder: 'Select an organization first.',
            options: [],
          };
        }
        try {
          const groups = await fetchIdeaGroups({ accessToken: auth.secret_text, organizationId });
          return {
            disabled: false,
            options: groups.map((group) => ({ label: group.name, value: group.id })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: `Failed to load idea groups: ${reasonOf(error)}`,
            options: [],
          };
        }
      },
    }),
};

export const bufferFetch = {
  fetchOrganizations,
  fetchChannels,
  fetchIdeaGroups,
  fetchNewPosts,
  pollNewPosts,
  startPolling,
};

const TRIGGER_PAGE_SIZE = 100;
const TEST_PAGE_SIZE = 10;
const MAX_TRIGGER_PAGES = 10;
const LEGACY_LAST_POLL_KEY = 'lastPoll';
const CHECKPOINT_KEY = 'pollCheckpoint';

type PollCheckpoint = { epoch: number; ids: string[] };

export type Organization = { id: string; name: string };

export type IdeaGroup = { id: string; name: string; isLocked: boolean };

export type Channel = {
  id: string;
  name: string;
  displayName?: string | null;
  service: string;
  organizationId: string;
  createdAt?: string;
};

export type BufferPost = {
  id: string;
  text?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  dueAt?: string | null;
  sentAt?: string | null;
  channelId?: string;
  channelService?: string;
  channel?: { id: string; name: string; service: string };
  tags?: Array<{ id: string; name: string }>;
};
