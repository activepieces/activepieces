import { Property } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi } from './client';
import { GenayaClient, GenayaInvoice, GenayaNamedRecord, GenayaTeamMember } from './types';

const CONNECT_FIRST = 'Connect your Genaya account first';

function clientDropdown({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    auth: genayaAuth,
    displayName: 'Client',
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      try {
        const clients = await genayaApi.listNewestFirst<GenayaClient>({
          apiKey: auth.secret_text,
          path: '/clients',
        });
        return {
          disabled: false,
          options: clients.map((client) => ({ label: clientLabel(client), value: client.id })),
          placeholder: clients.length === 0 ? 'No clients yet' : undefined,
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load clients. Check the API key.' };
      }
    },
  });
}

const invoiceDropdown = Property.Dropdown({
  auth: genayaAuth,
  displayName: 'Invoice',
  description:
    'The invoice to mark as sent. The list shows your 100 most recent invoices; map the ID from an earlier step (for example Create Invoice) to use any other.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: CONNECT_FIRST };
    }
    try {
      const invoices = await genayaApi.listNewestFirst<GenayaInvoice>({
        apiKey: auth.secret_text,
        path: '/invoices',
      });
      return {
        disabled: false,
        options: invoices.map((invoice) => ({ label: invoiceLabel(invoice), value: invoice.id })),
        placeholder: invoices.length === 0 ? 'No invoices yet' : undefined,
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Could not load invoices. Check the API key.' };
    }
  },
});

const appointmentTypeDropdown = Property.Dropdown({
  auth: genayaAuth,
  displayName: 'Appointment Type',
  description: 'One of the appointment types set up in Genaya (Operations > Appointment Types).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: CONNECT_FIRST };
    }
    try {
      const page = await genayaApi.listPage<GenayaNamedRecord>({
        apiKey: auth.secret_text,
        path: '/appointment-types',
      });
      return {
        disabled: false,
        options: page.data.map((type) => ({ label: type.name || type.id, value: type.id })),
        placeholder: page.data.length === 0 ? 'No appointment types set up yet' : undefined,
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Could not load appointment types. Check the API key.' };
    }
  },
});

function teamMembersDropdown({ description }: { description: string }) {
  return Property.MultiSelectDropdown({
    auth: genayaAuth,
    displayName: 'Assigned Team Members',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: CONNECT_FIRST };
      }
      try {
        const members = await listTeamMembers(auth.secret_text);
        return {
          disabled: false,
          options: members.map((member) => ({
            label: member.email ? `${member.name || member.email} (${member.email})` : member.name || member.id,
            value: member.id,
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load team members. Check the API key.' };
      }
    },
  });
}

const taskEnvironmentDropdown = Property.Dropdown({
  auth: genayaAuth,
  displayName: 'Task Environment',
  description: 'The task board that holds the group. Used to list its groups below.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: CONNECT_FIRST };
    }
    try {
      const page = await genayaApi.listPage<GenayaNamedRecord>({
        apiKey: auth.secret_text,
        path: '/task-environments',
      });
      return {
        disabled: false,
        options: page.data.map((environment) => ({ label: environment.name || environment.id, value: environment.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Could not load task environments. Check the API key.' };
    }
  },
});

const taskGroupDropdown = Property.Dropdown({
  auth: genayaAuth,
  displayName: 'Task Group',
  description: 'The group (column) the task is created in.',
  required: true,
  refreshers: ['environment'],
  options: async ({ auth, environment }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: CONNECT_FIRST };
    }
    if (typeof environment !== 'string' || environment === '') {
      return { disabled: true, options: [], placeholder: 'Select a task environment first' };
    }
    try {
      const page = await genayaApi.listPage<GenayaNamedRecord>({
        apiKey: auth.secret_text,
        path: `/task-environments/${encodeURIComponent(environment)}/groups`,
      });
      return {
        disabled: false,
        options: page.data.map((group) => ({ label: group.name || group.id, value: group.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Could not load task groups. Check the API key.' };
    }
  },
});

const leadTableDropdown = Property.Dropdown({
  auth: genayaAuth,
  displayName: 'Lead Table',
  description: 'Only start the flow for leads added to this table. Leave empty to start it for every new lead.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: CONNECT_FIRST };
    }
    try {
      const page = await genayaApi.listPage<GenayaNamedRecord>({
        apiKey: auth.secret_text,
        path: '/lead-tables',
      });
      return {
        disabled: false,
        options: page.data.map((table) => ({ label: table.name || table.id, value: table.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Could not load lead tables. Check the API key.' };
    }
  },
});

function addressProps() {
  return {
    address_line1: Property.ShortText({
      displayName: 'Street Address',
      description: 'Street and number, for example 500 Market St.',
      required: false,
    }),
    address_unit: Property.ShortText({
      displayName: 'Unit',
      description: 'Apartment, suite or unit, for example Suite 400.',
      required: false,
    }),
    address_city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    address_state: Property.ShortText({
      displayName: 'State or Region',
      description: 'For example CA.',
      required: false,
    }),
    address_zip: Property.ShortText({
      displayName: 'ZIP or Postal Code',
      required: false,
    }),
    address_country: Property.ShortText({
      displayName: 'Country',
      description: 'For example US.',
      required: false,
    }),
  };
}

async function listTeamMembers(apiKey: string): Promise<GenayaTeamMember[]> {
  const page = await genayaApi.listPage<GenayaTeamMember>({ apiKey, path: '/team' });
  return page.data;
}

function clientLabel(client: GenayaClient): string {
  const name =
    client.fullName ||
    [client.firstName, client.lastName].filter(Boolean).join(' ') ||
    client.company ||
    client.email ||
    client.phone ||
    client.id;
  const contact = client.email || client.phone;
  return contact && contact !== name ? `${name} (${contact})` : name;
}

function invoiceLabel(invoice: GenayaInvoice): string {
  const number = invoice.number ?? invoice.uuid ?? invoice.id;
  const client = invoice.clientName || [invoice.firstName, invoice.lastName].filter(Boolean).join(' ') || invoice.companyName;
  const amount = typeof invoice.total === 'number' ? `${invoice.total} ${invoice.currency || 'USD'}` : undefined;
  const parts = [`Invoice #${number}`, client, amount, invoice.status].filter(Boolean);
  return parts.join(' - ');
}

export const genayaProps = {
  clientDropdown,
  invoiceDropdown,
  appointmentTypeDropdown,
  teamMembersDropdown,
  taskEnvironmentDropdown,
  taskGroupDropdown,
  leadTableDropdown,
  addressProps,
  listTeamMembers,
};
