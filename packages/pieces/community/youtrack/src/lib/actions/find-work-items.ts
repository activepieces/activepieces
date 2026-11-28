import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX, WORK_ITEM_FIELDS, workItemRow } from '../common';
import { youtrackClient } from '../common/client';
import { findWorkItemsActionOutputSchema } from '../output-schemas';

export const findWorkItemsAction = createAction({
  auth: youtrackAuth,
  name: 'find_work_items',
  classification: 'SEARCH',
  outputSchema: findWorkItemsActionOutputSchema,
  displayName: 'Find Work Items',
  description: 'Finds time tracking work items by issue query, author and date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find logged time (work items) across YouTrack: filter by an issue query (e.g. "issue id: APT-5" or "project: APT"), by author login ("me" for the token user) and by a date range (YYYY-MM-DD). Each row has the work item ID (for Delete Work Item), date, duration in minutes and as text, work type, author and issue. Returns items plus hasMore. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Issue Query', description: 'Optional YouTrack issue query, like "issue id: APT-5" or "project: APT".', required: false }),
    author: Property.ShortText({ displayName: 'Author', description: 'Optional author login, or "me" for the token user.', required: false }),
    startDate: Property.ShortText({ displayName: 'From Date', description: 'Optional first day, YYYY-MM-DD.', required: false }),
    endDate: Property.ShortText({ displayName: 'To Date', description: 'Optional last day, YYYY-MM-DD.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: `Max work items to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of work items to skip. Default 0.', required: false }),
  },
  async run(context) {
    const startDate = youtrackClient.optionalText(context.propsValue.startDate);
    const endDate = youtrackClient.optionalText(context.propsValue.endDate);
    const start = youtrackClient.parseDate({ value: startDate, label: 'From Date' });
    const end = youtrackClient.parseDate({ value: endDate, label: 'To Date' });
    if (start !== undefined && end !== undefined && end < start) {
      throw new Error('To Date must not be before From Date.');
    }
    const { items, hasMore } = await youtrackClient.listPage({
      auth: context.auth,
      path: '/workItems',
      query: {
        fields: WORK_ITEM_FIELDS,
        query: youtrackClient.optionalText(context.propsValue.query),
        author: youtrackClient.optionalText(context.propsValue.author),
        startDate,
        endDate,
      },
      limit: youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX }),
      skip: context.propsValue.skip,
      operation: 'find work items',
    });
    return { items: items.map(workItemRow), hasMore };
  },
});
