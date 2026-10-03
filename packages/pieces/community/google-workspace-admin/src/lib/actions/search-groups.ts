import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryGroup, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const searchGroups = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'search_groups',
  classification: 'SEARCH',
  displayName: 'Search Groups',
  description: 'Finds groups that match a search query, or that a user belongs to.',
  audience: 'both',
  aiMetadata: {
    description:
      "Search Google Workspace groups with Admin SDK query syntax (e.g. \"name:'Sales*'\"), or list the groups a specific user belongs to. Leave everything empty to list all groups. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        "e.g. \"name:'Sales*'\" or \"email:marketing*\". See https://developers.google.com/admin-sdk/directory/v1/guides/search-groups.",
      required: false,
    }),
    user: googleAdminProps.user({
      displayName: 'Member',
      description: 'Only return groups this user or group is a member of.',
      required: false,
    }),
    domain: googleAdminProps.domain({
      required: false,
      description: 'Only return groups from this domain. Leave empty for all domains.',
    }),
    limit: Property.Number({ displayName: 'Max Results', required: false, defaultValue: 100 }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.listAll<{ nextPageToken?: string; groups?: DirectoryGroup[] }, DirectoryGroup>({
      auth,
      url: `${DIRECTORY_URL}/groups`,
      getItems: (r) => r.groups,
      queryParams: {
        customer: propsValue.domain || propsValue.user ? undefined : 'my_customer',
        domain: propsValue.domain,
        userKey: propsValue.user,
        query: propsValue.query,
      },
      limit: propsValue.limit ?? 100,
    });
  },
});
