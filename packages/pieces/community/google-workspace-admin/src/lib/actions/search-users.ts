import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryUser, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const searchUsers = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'search_users',
  classification: 'SEARCH',
  displayName: 'Search Users',
  description: 'Finds users that match a search query.',
  audience: 'both',
  aiMetadata: {
    description:
      "Search Google Workspace users with Admin SDK query syntax (e.g. \"orgUnitPath='/Sales' isSuspended=false\"). Leave the query empty to list all users. Use Get User when you already know the exact email. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        "Plain text matches name and email prefixes (e.g. \"jane\"). Advanced filters are supported, e.g. \"orgUnitPath='/Sales' isSuspended=false\". See https://developers.google.com/admin-sdk/directory/v1/guides/search-users.",
      required: false,
    }),
    domain: googleAdminProps.domain({
      required: false,
      description: 'Only return users from this domain. Leave empty for all domains.',
    }),
    showDeleted: Property.Checkbox({
      displayName: 'Only Deleted Users',
      description: 'Return users deleted in the last 20 days instead of active ones.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const users = await googleAdminClient.listAll<{ nextPageToken?: string; users?: DirectoryUser[] }, DirectoryUser>({
      auth,
      url: `${DIRECTORY_URL}/users`,
      getItems: (r) => r.users,
      queryParams: {
        customer: propsValue.domain ? undefined : 'my_customer',
        domain: propsValue.domain,
        query: propsValue.query,
        showDeleted: propsValue.showDeleted ? true : undefined,
        orderBy: 'email',
      },
      limit: propsValue.limit ?? 100,
    });
    return users.map(googleAdminClient.flattenUser);
  },
});
