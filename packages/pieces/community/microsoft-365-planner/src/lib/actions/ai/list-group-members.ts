import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerAiProps } from '../../common/ai-props';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerMemberListOutputSchema } from '../../output-schemas';

export const listGroupMembersAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_group_members',
  outputSchema: microsoft365PlannerMemberListOutputSchema,
  displayName: 'List Group Members',
  description: 'Lists the users in a Microsoft 365 group.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the users in a Microsoft 365 group (Group ID from List Groups or from a plan’s owner), one page at a time: the people tasks in that group’s plans can be assigned to. Non-user members such as devices and nested groups are left out, so a page can hold fewer than Limit users. Pass Next Cursor to continue.',
    idempotent: true,
  },
  props: {
    groupId: microsoft365PlannerAiProps.groupId({ required: true }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Members per page, 1 to 999. Defaults to 100.',
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
    const page = await microsoft365PlannerApi.listGroupMembers({
      auth,
      groupId: propsValue.groupId,
      limit,
      cursor: propsValue.cursor,
    });
    const users = page.items.filter(
      (member) => member['@odata.type'] === '#microsoft.graph.user'
    );
    return { users, count: users.length, nextCursor: page.nextCursor };
  },
});
