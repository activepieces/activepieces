import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoft365PlannerAuth } from '../../auth';
import { microsoft365PlannerApi } from '../../common/api';
import { microsoft365PlannerGroupListOutputSchema } from '../../output-schemas';

export const listGroupsAction = createAction({
  auth: microsoft365PlannerAuth,
  name: 'microsoft_365_planner_list_groups',
  outputSchema: microsoft365PlannerGroupListOutputSchema,
  displayName: 'List Groups',
  description: 'Lists the Microsoft 365 groups that can own plans.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Microsoft 365 groups in the organization (only these can own Planner plans), with ID, name, email and visibility, one page at a time. Pass Next Cursor from the previous page to continue. Use a group ID with Create Plan, List Plans or List Group Members.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Groups per page, 1 to 999. Defaults to 100.',
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
    const page = await microsoft365PlannerApi.listUnifiedGroups({
      auth,
      limit,
      cursor: propsValue.cursor,
    });
    return {
      groups: page.items,
      count: page.items.length,
      nextCursor: page.nextCursor,
    };
  },
});
