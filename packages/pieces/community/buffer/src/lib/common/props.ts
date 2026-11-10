import { Property } from '@activepieces/pieces-framework';
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
  windowField,
  windowStart,
  firstPageOnly,
}: {
  accessToken: string;
  organizationId: string;
  channelIds?: string[];
  statuses: string[];
  sortField: 'createdAt' | 'dueAt';
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
        input: { organizationId, filter, sort: [{ field: sortField, direction: 'desc' }] },
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
  throw new Error(`More than ${MAX_TRIGGER_PAGES * TRIGGER_PAGE_SIZE} matching posts appeared since the last check, more than one poll can read. Narrow the trigger to fewer channels.`);
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
};

const TRIGGER_PAGE_SIZE = 100;
const TEST_PAGE_SIZE = 10;
const MAX_TRIGGER_PAGES = 10;

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
