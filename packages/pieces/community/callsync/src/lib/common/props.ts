import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall } from './client';

type Row = Record<string, unknown>;

const disconnected = {
  disabled: true,
  options: [],
  placeholder: 'Connect your CallSync account first',
};

const joined = (...parts: unknown[]) =>
  parts.filter((part) => part !== undefined && part !== null && part !== '').join(' · ');

export const contactDropdown = <R extends boolean>({
  required,
  description,
}: {
  required: R;
  description?: string;
}) =>
  Property.Dropdown({
    auth: callsyncAuth,
    displayName: 'Contact',
    description: description ?? 'Type a name or phone number to find the contact.',
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return disconnected;
      const response = await callsyncApiCall<{ data?: Row[] }>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: 'crm/contacts',
        query: { limit: 10, search: searchValue },
      });
      return {
        disabled: false,
        options: (response.data ?? []).map((contact) => ({
          label: joined(contact['name'], contact['phone']) || String(contact['id']),
          value: Number(contact['id']),
        })),
      };
    },
  });

export const callDropdown = Property.Dropdown({
  auth: callsyncAuth,
  displayName: 'Call',
  description:
    'Pick a recent call, or type a phone number or name to find one. To use the call from a CallSync trigger, map its call_id instead.',
  required: true,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return disconnected;
    const response = await callsyncApiCall<{ data?: Row[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: 'calls',
      query: { limit: 10, search: searchValue },
    });
    return {
      disabled: false,
      options: (response.data ?? []).map((call) => {
        const caller = (call['caller'] ?? {}) as Row;
        const name = caller['name'] && caller['name'] !== 'Unknown' ? caller['name'] : caller['phone'];
        return {
          label: joined(name, call['direction'], String(call['time'] ?? '').slice(0, 16).replace('T', ' ')),
          value: Number(call['id']),
        };
      }),
    };
  },
});

export const taskDropdown = Property.Dropdown({
  auth: callsyncAuth,
  displayName: 'Task',
  description: 'Pick a pending task.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return disconnected;
    const response = await callsyncApiCall<{ data?: Row[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: 'crm/tasks',
      query: { status: 'PENDING' },
    });
    const tasks = response.data ?? [];
    return {
      disabled: false,
      placeholder: tasks.length ? undefined : 'No pending tasks',
      options: tasks.map((task) => ({
        label: joined(
          task['contact_name'],
          task['description'] || task['type'],
          task['due_date'] && `due ${task['due_date']}`
        ),
        value: Number(task['id']),
      })),
    };
  },
});

/** Stages, priorities, segments and lead sources come from the workspace's own CRM settings. */
const crmDropdown = (displayName: string, group: string, description: string) =>
  Property.Dropdown({
    auth: callsyncAuth,
    displayName,
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return disconnected;
      const config = await callsyncApiCall<Record<string, Row[] | undefined>>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: 'crm/config',
      });
      return {
        disabled: false,
        options: (config[group] ?? []).map((item) => ({
          label: String(item['label']),
          value: String(item['id']),
        })),
      };
    },
  });

export const stageDropdown = () =>
  crmDropdown('Stage', 'stages', 'Pipeline stage, as set up in your CallSync CRM.');
export const priorityDropdown = () =>
  crmDropdown('Priority', 'priorities', 'Priority, as set up in your CallSync CRM.');
export const segmentDropdown = () =>
  crmDropdown('Segment', 'segments', 'Segment, as set up in your CallSync CRM.');
export const sourceDropdown = () =>
  crmDropdown('Lead Source', 'sources', 'Where the lead came from, as set up in your CallSync CRM.');

export const TASK_TYPES = [
  { label: 'Call', value: 'CALL' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Follow Up', value: 'FOLLOW_UP' },
  { label: 'Meeting', value: 'MEETING' },
  { label: 'To Do', value: 'TO_DO' },
];

export const TASK_STATUSES = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];
