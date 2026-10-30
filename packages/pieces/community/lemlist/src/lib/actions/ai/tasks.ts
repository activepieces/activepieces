import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isRecord, lemlistApiCall } from '../../common/client';
import { lemlistAuth } from '../../common/constants';
import { aiProps } from '../../common/ai-props';
import { lemlistInput } from '../../common/input';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

const TASK_TYPES = ['manual', 'email', 'phone', 'linkedin', 'whatsapp'];
const PRIORITIES = [
  { label: 'None', value: '' },
  { label: 'Low', value: '0' },
  { label: 'Medium', value: '1' },
  { label: 'High', value: '2' },
];

export const createTaskAction = createAction({
  auth: lemlistAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task for a team member about a contact, company or lead.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a lemlist task (manual, email, phone, linkedin or whatsapp) assigned to a team member (usr_...) about a contact (ctc_), company (cpn_, manual only) or lead (lea_), with a due date. Nothing is sent: the task waits for a person. Not idempotent: each run creates another task.',
    idempotent: false,
  },
  props: {
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'Contact (ctc_), company (cpn_) or lead (lea_) ID.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: { disabled: false, options: TASK_TYPES.map((value) => ({ label: value, value })) },
    }),
    assigned_to: Property.ShortText({ displayName: 'Assigned To (User ID)', required: true }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'ISO 8601 date-time.', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    message: Property.LongText({ displayName: 'Instructions', required: false }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: { disabled: false, options: PRIORITIES },
    }),
  },
  outputSchema: lemlistSchemas.task,
  async run({ auth, propsValue }) {
    const type = lemlistInput.requireText({ value: propsValue.type, label: 'Type' });
    if (!TASK_TYPES.includes(type)) {
      throw new Error(`Type must be one of ${TASK_TYPES.join(', ')}.`);
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/tasks',
      body: lemlistInput.compact({
        recordId: lemlistInput.requireText({ value: propsValue.record_id, label: 'Record ID' }),
        type,
        assignedTo: lemlistInput.requireText({ value: propsValue.assigned_to, label: 'Assigned To' }),
        dueDate: lemlistInput.isoDate({ value: propsValue.due_date, label: 'Due Date' }),
        title: propsValue.title,
        message: propsValue.message,
        priority: propsValue.priority,
      }),
    });
  },
});

export const listTasksAction = createAction({
  auth: lemlistAuth,
  name: 'list_tasks',
  classification: 'SEARCH',
  displayName: 'List Pending Tasks',
  description: 'Lists pending tasks of the team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists pending (not done) lemlist tasks of the team with type, title, due date, assignee and linked lead/contact/campaign. Paged by Page (starts at 0); an empty page means there are no more. Read-only.',
    idempotent: true,
  },
  props: {
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 0.', required: false }),
  },
  outputSchema: lemlistSchemas.taskPage,
  async run({ auth, propsValue }) {
    const page = lemlistInput.boundedInt({ value: propsValue.page, label: 'Page', min: 0, max: 100_000 }) ?? 0;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/tasks',
      query: { filters: '[]', page },
    });
    const items = lemlistResults.listFrom({ body, key: 'results' });
    return { items, count: items.length, page };
  },
});

export const updateTaskAction = createAction({
  auth: lemlistAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates a task: assignee, due date, title, instructions, priority or done.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one lemlist task (opp_...): assignee, due date, title, instructions, priority or done status (yes/no; unchanged or empty keeps it). Only fields you pass change; at least one is required. Idempotent.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
    assigned_to: Property.ShortText({ displayName: 'Assigned To (User ID)', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'ISO 8601 date-time.', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    message: Property.LongText({ displayName: 'Instructions', required: false }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Leave empty to keep the current priority.',
      required: false,
      options: { disabled: false, options: PRIORITIES.filter((option) => option.value !== '') },
    }),
    done: aiProps.triState({ displayName: 'Done', description: 'Mark the task done (yes) or not done (no).' }),
  },
  outputSchema: lemlistSchemas.task,
  async run({ auth, propsValue }) {
    const dueDate = lemlistInput.optionalText(propsValue.due_date);
    const changes = lemlistInput.compact({
      assignedTo: propsValue.assigned_to,
      dueDate: dueDate === undefined ? undefined : lemlistInput.isoDate({ value: dueDate, label: 'Due Date' }),
      title: propsValue.title,
      message: propsValue.message,
      priority: propsValue.priority,
      done: lemlistInput.triState(propsValue.done),
    });
    if (Object.keys(changes).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      resourceUri: '/tasks',
      body: { ...changes, id: lemlistInput.requireText({ value: propsValue.task_id, label: 'Task ID' }) },
    });
  },
});

export const ignoreTasksAction = createAction({
  auth: lemlistAuth,
  name: 'ignore_tasks',
  classification: 'WRITE',
  displayName: 'Ignore Tasks',
  description: 'Marks tasks as ignored.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks one or more lemlist tasks (opp_...) as ignored so they leave the pending list without being done. Idempotent: ignoring an ignored task changes nothing.',
    idempotent: true,
  },
  props: {
    task_ids: Property.Array({ displayName: 'Task IDs', required: true }),
  },
  outputSchema: lemlistSchemas.ignoredTasks,
  async run({ auth, propsValue }) {
    const ids = lemlistInput.stringList({ value: propsValue.task_ids, label: 'Task IDs' });
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/tasks/ignore',
      body: { ids },
    });
    return { ignored: ids, count: ids.length, response: isRecord(body) ? body : null };
  },
});
