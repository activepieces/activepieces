import { Property } from '@activepieces/pieces-framework';
import { bufferAuth } from './auth';
import { bufferClient } from './client';

async function fetchOrganizations(accessToken: string): Promise<Organization[]> {
  const data = await bufferClient.graphql<{
    account: { organizations: Organization[] };
  }>({
    accessToken,
    query: `query { account { organizations { id name } } }`,
  });
  return data.account?.organizations ?? [];
}

async function fetchChannels(
  accessToken: string,
  organizationId: string,
): Promise<Channel[]> {
  const data = await bufferClient.graphql<{ channels: Channel[] }>({
    accessToken,
    query: `query Channels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) {
        id
        name
        service
        organizationId
        createdAt
      }
    }`,
    variables: { organizationId },
  });
  return data.channels ?? [];
}

async function fetchPosts({
  accessToken,
  organizationId,
  channelIds,
  statusFilter,
  first = 50,
}: {
  accessToken: string;
  organizationId: string;
  channelIds?: string[];
  statusFilter?: (status: string | undefined) => boolean;
  first?: number;
}): Promise<BufferPost[]> {
  const filter: Record<string, unknown> = {};
  if (channelIds && channelIds.length > 0) filter['channelIds'] = channelIds;

  const data = await bufferClient.graphql<{
    posts: { edges?: Array<{ node: BufferPost }> };
  }>({
    accessToken,
    query: `query Posts($input: PostsInput!, $first: Int) {
      posts(input: $input, first: $first) {
        edges {
          node {
            id
            text
            status
            createdAt
            updatedAt
            dueAt
            sentAt
            channelId
            channelService
            channel { id name service }
            tags { id name }
          }
        }
      }
    }`,
    variables: {
      input: {
        organizationId,
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      },
      first,
    },
  });
  const posts = (data.posts?.edges ?? []).map((edge) => edge.node);
  return statusFilter ? posts.filter((post) => statusFilter(post.status)) : posts;
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
        } catch {
          return {
            disabled: true,
            placeholder: 'Failed to load organizations.',
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
      options: async ({ auth, organizationId }) => {
        if (!auth || !organizationId) {
          return {
            disabled: true,
            placeholder: 'Select an organization first.',
            options: [],
          };
        }
        try {
          const channels = await fetchChannels(
            auth.secret_text,
            organizationId as string,
          );
          return {
            disabled: false,
            options: channels.map((channel) => ({
              label: `${channel.name} (${channel.service})`,
              value: channel.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            placeholder: 'Failed to load channels.',
            options: [],
          };
        }
      },
    }),

  channelId: () =>
    Property.Dropdown<string, true, typeof bufferAuth>({
      auth: bufferAuth,
      displayName: 'Channel',
      description: 'The Buffer channel.',
      required: true,
      refreshers: ['organizationId'],
      options: async ({ auth, organizationId }) => {
        if (!auth || !organizationId) {
          return {
            disabled: true,
            placeholder: 'Select an organization first.',
            options: [],
          };
        }
        try {
          const channels = await fetchChannels(
            auth.secret_text,
            organizationId as string,
          );
          return {
            disabled: false,
            options: channels.map((channel) => ({
              label: `${channel.name} (${channel.service})`,
              value: channel.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            placeholder: 'Failed to load channels.',
            options: [],
          };
        }
      },
    }),
};

export const bufferQueries = {
  fetchOrganizations,
  fetchChannels,
  fetchPosts,
};

export type Organization = { id: string; name: string };

export type Channel = {
  id: string;
  name: string;
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
  dueAt?: string;
  sentAt?: string;
  channelId?: string;
  channelService?: string;
  channel?: { id: string; name: string; service: string };
  tags?: Array<{ id: string; name: string }>;
};
