import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerMemberListOutputSchema } from '../../output-schemas';

export const listUsersAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_users',
  outputSchema: microsoft365PlannerMemberListOutputSchema,
  displayName: 'List Users',
  description: 'Lists or finds users in your organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the users in the signed-in user’s Microsoft 365 organization, one page at a time, or finds them by the start of their name or email with Starts With. Use it to turn a person’s name or email into the User ID that Create Task, Assign Task and Update Task need. A task can only be assigned to a member of the plan’s group; List Group Members lists those. Pass Next Cursor to continue.',
    idempotent: true,
  },
  props: {
    startsWith: Property.ShortText({
      displayName: 'Starts With',
      description:
        'Only return users whose display name, email or user principal name starts with this text (case-insensitive), e.g. "ada" or "ada@contoso.com".',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Users per page, 1 to 999. Defaults to 100.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Next Cursor from the previous page. Leave empty for the first page.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 999) {
      throw new Error('Limit must be a whole number from 1 to 999.');
    }
    const page = await microsoft365PlannerApi.listUserPage({
      auth,
      limit,
      cursor: propsValue.cursor,
      startsWith: propsValue.startsWith,
    });
    return {
      users: page.items,
      count: page.items.length,
      nextCursor: page.nextCursor,
    };
  },
});
