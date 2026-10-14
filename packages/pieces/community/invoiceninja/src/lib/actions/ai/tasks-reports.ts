import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';
import { invoiceNinjaProps } from '../../common/props';
import { invoiceNinjaReports } from '../../common/report';

const TASK_CLEARABLE = ['description', 'project_id'] as const;

export const getTask = createAction({
  auth: invoiceninjaAuth,
  name: 'get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Get one task by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja task (time entry) by ID: description, client, project, rate, duration and time log. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.task,
  props: { id: entityActions.getIdProp('Task') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'tasks', label: 'Task', id: propsValue.id });
  },
});

export const listTasks = createAction({
  auth: invoiceninjaAuth,
  name: 'list_tasks',
  classification: 'SEARCH',
  displayName: 'List Tasks',
  description: 'List tasks, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja tasks, optionally for one client or project, by exact task number, or by free-text search on the description. Use number to check whether a task number already exists (total 0 = no). Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.taskList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', required: false }),
    number: Property.ShortText({ displayName: 'Task Number', required: false }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    sort: entityActions.sortProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'tasks',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        project_tasks: invoiceNinjaClient.optionalId({ value: propsValue.project_id, label: 'Project ID' }),
        number: invoiceNinjaClient.optionalText(propsValue.number),
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
        sort: propsValue.sort,
      },
    });
  },
});

export const createTaskAi = createAction({
  auth: invoiceninjaAuth,
  name: 'create_task_ai',
  classification: 'WRITE',
  displayName: 'Create Task (by IDs)',
  description: 'Create a task (billable time entry), optionally with logged time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an Invoice Ninja task with description, optional client_id, project_id, hourly rate and number (must be unique; empty = auto). Pass start_time and end_time (ISO 8601) to log a finished time block, or start_time alone to leave a timer running. Not idempotent unless number is given (a duplicate number is rejected).',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.task,
  props: {
    description: Property.LongText({ displayName: 'Description', required: true }),
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', required: false }),
    rate: Property.Number({ displayName: 'Hourly Rate', required: false }),
    number: Property.ShortText({ displayName: 'Task Number', required: false }),
    start_time: Property.ShortText({ displayName: 'Start Time', description: 'ISO 8601, e.g. 2026-01-31T09:00:00Z.', required: false }),
    end_time: Property.ShortText({ displayName: 'End Time', description: 'ISO 8601. Empty with a start time = timer keeps running.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = taskBody(propsValue);
    if (body['description'] === undefined) throw new Error('Description is required.');
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/tasks', body }),
    );
  },
});

export const updateTask = createAction({
  auth: invoiceninjaAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Change fields of a task. Empty fields are left unchanged.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an Invoice Ninja task by ID: description, client, project or hourly rate. Only fields you pass change; clear_fields blanks description or project_id. Use Start Task / Stop Task for the timer. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.task,
  props: {
    task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', required: false }),
    rate: Property.Number({ displayName: 'Hourly Rate', required: false }),
    clear_fields: invoiceNinjaProps.clearProp({ fields: TASK_CLEARABLE }),
  },
  async run({ auth, propsValue }) {
    const id = invoiceNinjaClient.parseId({ value: propsValue.task_id, label: 'Task ID' });
    const body = {
      ...invoiceNinjaClient.clearedFields({ value: propsValue.clear_fields, allowed: TASK_CLEARABLE }),
      ...taskBody({ ...propsValue, number: undefined, start_time: undefined, end_time: undefined }),
    };
    if (Object.keys(body).length === 0) throw new Error('Nothing to update: give at least one field or clear_fields.');
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.PUT, path: `/tasks/${id}`, body }),
    );
  },
});

export const startTask = createAction({
  auth: invoiceninjaAuth,
  name: 'start_task',
  classification: 'WRITE',
  displayName: 'Start Task Timer',
  description: 'Start the timer of a task (adds a new running time entry).',
  audience: 'ai',
  aiMetadata: {
    description: 'Starts the timer of an Invoice Ninja task by adding a running time-log entry from now. A task that is already running is left as is. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.task,
  props: { id: entityActions.bulkIdProp('Task') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'tasks', label: 'Task', action: 'start', id: propsValue.id });
  },
});

export const stopTask = createAction({
  auth: invoiceninjaAuth,
  name: 'stop_task',
  classification: 'WRITE',
  displayName: 'Stop Task Timer',
  description: 'Stop the running timer of a task.',
  audience: 'ai',
  aiMetadata: {
    description: 'Stops the running timer of an Invoice Ninja task, closing its open time-log entry at now; duration grows accordingly. A stopped task is left as is. Idempotent.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.task,
  props: { id: entityActions.bulkIdProp('Task') },
  async run({ auth, propsValue }) {
    return entityActions.runBulk({ auth: auth.props, entity: 'tasks', label: 'Task', action: 'stop', id: propsValue.id });
  },
});

export const runReport = createAction({
  auth: invoiceninjaAuth,
  name: 'run_report',
  classification: 'SEARCH',
  displayName: 'Run Report',
  description: 'Run an Invoice Ninja report and return its rows.',
  audience: 'ai',
  aiMetadata: {
    description: 'Runs an Invoice Ninja report (clients, contacts, invoices, invoice_items, quotes, quote_items, credits, payments, recurring_invoices, expenses, tasks, products, vendors) for a date range (all, last7, last30, this_month, last_month, this_quarter, last_quarter, this_year, last_year, or custom with start_date and end_date) and optionally one client. Waits up to 60 seconds for the result and returns {columns, rows (keyed by column identifier), rowCount}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.report,
  props: invoiceNinjaReports.reportProps(),
  async run({ auth, propsValue }) {
    return invoiceNinjaReports.runReport({
      auth: auth.props,
      reportType: propsValue.report_type ?? '',
      dateRange: propsValue.date_range ?? 'all',
      startDate: propsValue.start_date,
      endDate: propsValue.end_date,
      clientId: propsValue.client_id,
    });
  },
});

function unixSeconds({ value, label }: { value: unknown; label: string }): number | undefined {
  const text = invoiceNinjaClient.optionalText(value);
  if (text === undefined) return undefined;
  const ms = Date.parse(text);
  if (Number.isNaN(ms)) throw new Error(`${label} must be an ISO 8601 date-time.`);
  return Math.floor(ms / 1000);
}

function taskBody(props: Record<string, unknown>): Record<string, unknown> {
  const start = unixSeconds({ value: props['start_time'], label: 'Start Time' });
  const end = unixSeconds({ value: props['end_time'], label: 'End Time' });
  if (end !== undefined && start === undefined) throw new Error('End Time needs a Start Time.');
  if (start !== undefined && end !== undefined && end <= start) throw new Error('End Time must be after Start Time.');
  return invoiceNinjaClient.compact({
    description: invoiceNinjaClient.optionalText(props['description']),
    client_id: invoiceNinjaClient.optionalId({ value: props['client_id'], label: 'Client ID' }),
    project_id: invoiceNinjaClient.optionalId({ value: props['project_id'], label: 'Project ID' }),
    rate: invoiceNinjaClient.optionalNumber({ value: props['rate'], label: 'Hourly Rate', min: 0 }),
    number: invoiceNinjaClient.optionalText(props['number']),
    time_log: start === undefined ? undefined : JSON.stringify([[start, end ?? 0, '', true]]),
  });
}

export const invoiceNinjaTaskHelpers = { taskBody };
