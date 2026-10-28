import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, dueFields, flatten } from '../common/client';
import { contactDropdown, TASK_STATUSES } from '../common/props';

export const findTasks = createAction({
  auth: callsyncAuth,
  name: 'find_tasks',
  classification: 'SEARCH',
  displayName: 'Find Tasks',
  description: 'Finds CallSync tasks, soonest due first.',
  audience: 'both',
  aiMetadata: {
    description:
      'List CallSync CRM tasks, soonest due first, optionally for one contact, one status or one due day. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    contact: contactDropdown({ required: false, description: 'Only tasks for this contact.' }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'PENDING',
      options: { options: TASK_STATUSES },
    }),
    due: Property.DateTime({
      displayName: 'Due On',
      description: 'Only tasks due on this day.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most tasks to return.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { contact, status, due, limit } = context.propsValue;
    const response = await callsyncApiCall<{ data?: Record<string, unknown>[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: 'crm/tasks',
      query: { person_id: contact ?? undefined, status: status ?? undefined, due_date: dueFields(due)['due_date'] },
    });
    return (response.data ?? []).slice(0, limit ?? 25).map((task) => flatten(task));
  },
});
