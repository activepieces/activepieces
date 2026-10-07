import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';
import { listUsersActionOutputSchema } from '../../../output-schemas';

export const listUsersAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'Lists users in the monday.com account, with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List monday.com account users with ID, name, email, role kind and status; filter by exact emails (the way to resolve a user ID from an email), fuzzy name, user IDs, kind or status. Use to find the user IDs needed for people columns, board/workspace access and notifications. Returns up to 200 per page by default (max 1000). Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listUsersActionOutputSchema,
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Only return users with these exact email addresses.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Fuzzy search by user name.',
      required: false,
    }),
    user_ids: Property.Array({
      displayName: 'User IDs',
      description: 'Only return these user IDs.',
      required: false,
    }),
    user_kind: Property.StaticDropdown({
      displayName: 'User Kind',
      description: 'Only return users of this kind.',
      required: false,
      options: {
        options: [
          { label: 'Admin, member, guest and viewer', value: 'BASIC' },
          { label: 'Admin', value: 'ADMIN' },
          { label: 'Member', value: 'MEMBER' },
          { label: 'Guest', value: 'GUEST' },
          { label: 'View only', value: 'VIEW_ONLY' },
        ],
      },
    }),
    status: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'Filter by activation status (default: active and pending).',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Inactive', value: 'INACTIVE' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Users per page (default 200, max 1000).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
  },
  async run(context) {
    const { name, user_kind, status, limit, page } = context.propsValue;
    const emails = mondayApi.toStringArray(context.propsValue.emails);
    const userIds = mondayApi.toStringArray(context.propsValue.user_ids);
    if (limit !== undefined && limit !== null && (limit < 1 || limit > 1000)) {
      throw new Error('Limit must be between 1 and 1000.');
    }

    const data = await makeClient(context.auth).query<{ users: (MondayUser | null)[] | null }>({
      query: `query ($emails: [String!], $ids: [ID!], $name: String, $user_kind: UserKindFilterInput, $status: [UserStatus!], $limit: Int, $page: Int) {
        users(emails: $emails, ids: $ids, name: $name, user_kind: $user_kind, status: $status, limit: $limit, page: $page) {
          id
          name
          email
          title
          status
          url
          time_zone_identifier
          country_code
          location
          phone
          created_at
          user_config { kind }
        }
      }`,
      variables: {
        emails: emails.length > 0 ? emails : undefined,
        ids: userIds.length > 0 ? userIds : undefined,
        name: name || undefined,
        user_kind: user_kind ? { in: [user_kind] } : undefined,
        status: status && status.length > 0 ? status : undefined,
        limit: limit ?? undefined,
        page: page ?? undefined,
      },
    });

    const users = (data.users ?? [])
      .filter((user): user is MondayUser => user !== null)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title ?? null,
        kind: user.user_config?.kind ?? null,
        status: user.status ?? null,
        url: user.url ?? null,
        time_zone: user.time_zone_identifier ?? null,
        country_code: user.country_code ?? null,
        location: user.location ?? null,
        phone: user.phone ?? null,
        created_at: user.created_at ?? null,
      }));

    return { users, count: users.length };
  },
});

type MondayUser = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  status: string | null;
  url: string | null;
  time_zone_identifier: string | null;
  country_code: string | null;
  location: string | null;
  phone: string | null;
  created_at: string | null;
  user_config: { kind: string } | null;
};
