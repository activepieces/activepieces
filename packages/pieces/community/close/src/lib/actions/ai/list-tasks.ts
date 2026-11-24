import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

function viewOf(value: unknown): string | undefined {
  const view = closeClient.optionalText(value);
  if (view === undefined) return undefined;
  if (!['inbox', 'future', 'archive'].includes(view)) throw new Error('View must be inbox, future or archive.');
  return view;
}

const listTasks = createAction({
  auth: closeAuth,
  name: 'list_tasks',
  classification: 'SEARCH',
  displayName: 'List Tasks',
  description: 'List tasks with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Close lead tasks one page at a time (set includeNotifications to true to also get inbox items such as opportunity_due or missed_call), ordered by due date. Filter by lead (lead_...), assignee (user_...), completion, due date range (ISO 8601) or view (inbox = due now, future = due later, archive = completed). When hasMore is true, call again with skip set to nextSkip.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.tasks,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: false }),
    assignedTo: Property.ShortText({ displayName: 'Assigned To (user ID)', required: false }),
    isComplete: Property.ShortText({ displayName: 'Complete', description: 'true or false; leave empty for both.', required: false }),
    dueFrom: Property.ShortText({ displayName: 'Due From', description: 'ISO 8601 date or date-time, inclusive.', required: false }),
    dueTo: Property.ShortText({ displayName: 'Due To', description: 'ISO 8601 date or date-time, inclusive.', required: false }),
    includeNotifications: Property.Checkbox({ displayName: 'Include Inbox Notifications', description: 'Also return inbox items like opportunity_due or missed_call.', required: false, defaultValue: false }),
    view: Property.ShortText({ displayName: 'View', description: 'inbox, future or archive.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 100.', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'nextSkip from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const page = await closeClient.listPage({
      auth,
      path: '/task/',
      query: {
        lead_id: closeClient.optionalCloseId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
        assigned_to: closeClient.optionalCloseId({ value: propsValue.assignedTo, label: 'Assigned To', prefix: 'user' }),
        is_complete: closeClient.parseBoolean({ value: propsValue.isComplete, label: 'Complete' }),
        date__gte: closeClient.isoDate({ value: propsValue.dueFrom, label: 'Due From' }),
        date__lte: closeClient.isoDate({ value: propsValue.dueTo, label: 'Due To' }),
        _type: propsValue.includeNotifications === true ? 'all' : 'lead',
        view: viewOf(propsValue.view),
        _order_by: 'date',
      },
      limit: closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: closeClient.MAX_PAGE_SIZE }),
      skip: closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: Number.MAX_SAFE_INTEGER }),
    });
    return closeMappers.offsetPage({ ...page, map: closeMappers.task });
  },
});

export { listTasks };
