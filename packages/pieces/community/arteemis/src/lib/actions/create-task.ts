import { createAction, Property } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from '../common/client';

export const createTask = createAction({
  auth: arteemisAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Opens a call or a to-do in Arteemis, on a contact or on its own. It shows on the Tasks board and on the contact.',
  audience: 'both',
  aiMetadata: {
    description:
      'Open a call or a to-do in Arteemis with a due date, optionally about a contact (by contact ID) and with a note. Each call opens a new task, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'What to do, e.g. `Call Claire about the pilot`.',
      required: true,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Type',
      description: 'A call or a to-do.',
      required: true,
      defaultValue: 'call',
      options: {
        disabled: false,
        options: [
          { label: 'Call', value: 'call' },
          { label: 'To-do', value: 'todo' },
        ],
      },
    }),
    due_at: Property.DateTime({
      displayName: 'Due',
      description: 'When it should be done, e.g. `2026-10-28T09:00:00Z`.',
      required: true,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Optional. The Arteemis contact the task is about, e.g. `5b8f1c7e-2a4d-4e8b-9c3f-1d2e3f4a5b6c`, from **Create or Update Contact** or **Find Contact**.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional details, e.g. `She asked for the pricing of the Team plan`.',
      required: false,
    }),
  },
  async run(context) {
    const { title, kind, due_at: dueAt, contact_id: contactId, note } = context.propsValue;
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) {
      throw new Error(`"${dueAt}" is not a date Arteemis can read. Use an ISO 8601 date, e.g. 2026-10-28T09:00:00Z.`);
    }
    // The API takes an instant in UTC (2026-10-27T17:00:00Z).
    const { data } = await arteemisApi.call<{ task_id: string }>({
      apiKey: context.auth.secret_text,
      tool: 'tasks_manage',
      body: {
        operation: 'create',
        title,
        kind,
        due_at: due.toISOString(),
        ...arteemisApi.filled({ note, contact_id: contactId }),
      },
    });
    return { id: data.task_id, title, kind, due_at: due.toISOString(), contact_id: contactId?.trim() || null };
  },
});
