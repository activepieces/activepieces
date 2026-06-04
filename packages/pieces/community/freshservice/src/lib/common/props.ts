import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from './client';

interface FreshserviceRequester {
  id: number;
  first_name: string;
  last_name: string;
  primary_email: string;
}

interface FreshserviceAgent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface FreshserviceDepartment {
  id: number;
  name: string;
}

interface FreshserviceGroup {
  id: number;
  name: string;
}

interface FreshserviceTicket {
  id: number;
  subject: string;
}

export const freshserviceCommon = {
  change: (required = true) =>
    Property.Dropdown({
      auth: freshserviceAuth,
      displayName: 'Change',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await freshserviceApiCall<{
          changes: FreshserviceChange[];
        }>({
          method: HttpMethod.GET,
          endpoint: 'changes',
          auth,
          queryParams: { per_page: '100', order_by: 'created_at', order_type: 'desc' },
        });
        return {
          disabled: false,
          options: response.body.changes.map((change) => ({
            label: `#${change.id} — ${change.subject}`,
            value: change.id,
          })),
        };
      },
    }),

  ticket: (required = true) =>
    Property.Dropdown({
      auth: freshserviceAuth,
      displayName: 'Ticket',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await freshserviceApiCall<{
          tickets: FreshserviceTicket[];
        }>({
          method: HttpMethod.GET,
          endpoint: 'tickets',
          auth,
          queryParams: {
            order_by: 'created_at',
            order_type: 'desc',
            per_page: '100',
          },
        });
        return {
          disabled: false,
          options: response.body.tickets.map((ticket) => ({
            label: `#${ticket.id} — ${ticket.subject}`,
            value: ticket.id,
          })),
        };
      },
    }),

  requester: (required = true) =>
    Property.Dropdown({
      auth: freshserviceAuth,
      displayName: 'Requester',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await freshserviceApiCall<{
          requesters: FreshserviceRequester[];
        }>({
          method: HttpMethod.GET,
          endpoint: 'requesters',
          auth,
          queryParams: { per_page: '100' },
        });
        return {
          disabled: false,
          options: response.body.requesters.map((r) => ({
            label: `${r.first_name} ${r.last_name} (${r.primary_email})`,
            value: r.id,
          })),
        };
      },
    }),

  agent: (required = true) =>
    Property.Dropdown({
      auth: freshserviceAuth,
      displayName: 'Agent',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await freshserviceApiCall<{
          agents: FreshserviceAgent[];
        }>({
          method: HttpMethod.GET,
          endpoint: 'agents',
          auth,
          queryParams: { per_page: '100' },
        });
        return {
          disabled: false,
          options: response.body.agents.map((a) => ({
            label: `${a.first_name} ${a.last_name} (${a.email})`,
            value: a.id,
          })),
        };
      },
    }),

  department: (required = true) =>
    Property.Dropdown({
      auth: freshserviceAuth,
      displayName: 'Department',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await freshserviceApiCall<{
          departments: FreshserviceDepartment[];
        }>({
          method: HttpMethod.GET,
          endpoint: 'departments',
          auth,
          queryParams: { per_page: '100' },
        });
        return {
          disabled: false,
          options: response.body.departments.map((d) => ({
            label: d.name,
            value: d.id,
          })),
        };
      },
    }),

  group: (required = true) =>
    Property.Dropdown({
      auth: freshserviceAuth,
      displayName: 'Group',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const response = await freshserviceApiCall<{
          groups: FreshserviceGroup[];
        }>({
          method: HttpMethod.GET,
          endpoint: 'groups',
          auth,
          queryParams: { per_page: '100' },
        });
        return {
          disabled: false,
          options: response.body.groups.map((g) => ({
            label: g.name,
            value: g.id,
          })),
        };
      },
    }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    required: true,
    options: {
      options: [
        { label: 'Open', value: 2 },
        { label: 'Pending', value: 3 },
        { label: 'Resolved', value: 4 },
        { label: 'Closed', value: 5 },
      ],
    },
  }),

  priority: Property.StaticDropdown({
    displayName: 'Priority',
    required: true,
    options: {
      options: [
        { label: 'Low', value: 1 },
        { label: 'Medium', value: 2 },
        { label: 'High', value: 3 },
        { label: 'Urgent', value: 4 },
      ],
    },
  }),

  urgency: Property.StaticDropdown({
    displayName: 'Urgency',
    required: false,
    options: {
      options: [
        { label: 'Low', value: 1 },
        { label: 'Medium', value: 2 },
        { label: 'High', value: 3 },
      ],
    },
  }),

  impact: Property.StaticDropdown({
    displayName: 'Impact',
    required: false,
    options: {
      options: [
        { label: 'Low', value: 1 },
        { label: 'Medium', value: 2 },
        { label: 'High', value: 3 },
      ],
    },
  }),

  source: Property.StaticDropdown({
    displayName: 'Source',
    required: false,
    options: {
      options: [
        { label: 'Email', value: 1 },
        { label: 'Portal', value: 2 },
        { label: 'Phone', value: 3 },
        { label: 'Chat', value: 7 },
        { label: 'Feedback Widget', value: 9 },
        { label: 'Outbound Email', value: 10 },
      ],
    },
  }),

  changeStatus: Property.StaticDropdown({
    displayName: 'Status',
    required: false,
    options: {
      options: [
        { label: 'Open', value: 1 },
        { label: 'Planning', value: 2 },
        { label: 'Approval', value: 3 },
        { label: 'Pending Release', value: 4 },
        { label: 'Pending Review', value: 5 },
        { label: 'Closed', value: 6 },
      ],
    },
  }),

  changeRisk: Property.StaticDropdown({
    displayName: 'Risk',
    required: false,
    options: {
      options: [
        { label: 'Low', value: 1 },
        { label: 'Medium', value: 2 },
        { label: 'High', value: 3 },
        { label: 'Very High', value: 4 },
      ],
    },
  }),

  changeType: Property.StaticDropdown({
    displayName: 'Change Type',
    required: false,
    options: {
      options: [
        { label: 'Minor', value: 1 },
        { label: 'Standard', value: 2 },
        { label: 'Major', value: 3 },
        { label: 'Emergency', value: 4 },
      ],
    },
  }),

  taskStatus: Property.StaticDropdown({
    displayName: 'Task Status',
    required: false,
    options: {
      options: [
        { label: 'Open', value: 1 },
        { label: 'In Progress', value: 2 },
        { label: 'Completed', value: 3 },
      ],
    },
  }),
};

export interface FreshserviceChange {
  id: number;
  subject: string;
  description: string;
  status: number;
  priority: number;
  impact: number;
  risk: number;
  change_type: number;
  requester_id: number;
  agent_id: number | null;
  department_id: number | null;
  group_id: number | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FreshserviceChangeTask {
  id: number;
  title: string;
  description: string;
  status: number;
  agent_id: number | null;
  group_id: number | null;
  due_date: string | null;
  notify_before: number;
  created_at: string;
  updated_at: string;
}
