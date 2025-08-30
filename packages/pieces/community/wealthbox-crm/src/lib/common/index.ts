import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from './auth';
import { WealthboxClient } from './client';

export { wealthboxCrmAuth } from './auth';

export function makeClient(auth: PiecePropValueSchema<typeof wealthboxCrmAuth>) {
  const client = new WealthboxClient(auth.access_token);
  return client;
}

export { WealthboxClient } from './client';

export const wealthboxCommon = {
  contactId: Property.Dropdown({
    displayName: 'Contact ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const client = makeClient(auth as PiecePropValueSchema<typeof wealthboxCrmAuth>);
      const res = await client.listContacts();

      return {
        disabled: false,
        options: res.contacts.map((contact: any) => {
          return {
            label: `${contact.first_name} ${contact.last_name}` || contact.email || `Contact ${contact.id}`,
            value: contact.id,
          };
        }),
      };
    },
  }),

  taskId: Property.Dropdown({
    displayName: 'Task ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const client = makeClient(auth as PiecePropValueSchema<typeof wealthboxCrmAuth>);
      const res = await client.listTasks();

      return {
        disabled: false,
        options: res.tasks.map((task: any) => {
          return {
            label: task.subject || `Task ${task.id}`,
            value: task.id,
          };
        }),
      };
    },
  }),

  userId: Property.Dropdown({
    displayName: 'User ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const client = makeClient(auth as PiecePropValueSchema<typeof wealthboxCrmAuth>);
      const res = await client.listUsers();

      return {
        disabled: false,
        options: res.users.map((user: any) => {
          return {
            label: user.name || user.email,
            value: user.id,
          };
        }),
      };
    },
  }),

  teamId: Property.Dropdown({
    displayName: 'Team ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const client = makeClient(auth as PiecePropValueSchema<typeof wealthboxCrmAuth>);
      const res = await client.listTeams();

      return {
        disabled: false,
        options: res.teams.map((team: any) => {
          return {
            label: team.name,
            value: team.id,
          };
        }),
      };
    },
  }),

  workflowTemplateId: Property.Dropdown({
    displayName: 'Workflow Template ID',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const client = makeClient(auth as PiecePropValueSchema<typeof wealthboxCrmAuth>);
      const res = await client.listWorkflowTemplates();

      return {
        disabled: false,
        options: res.workflow_templates.map((template: any) => {
          return {
            label: template.name,
            value: template.id,
          };
        }),
      };
    },
  }),

  opportunityStage: Property.StaticDropdown({
    displayName: 'Opportunity Stage',
    required: false,
    options: {
      options: [
        { label: 'Prospecting', value: 'Prospecting' },
        { label: 'Qualification', value: 'Qualification' },
        { label: 'Proposal', value: 'Proposal' },
        { label: 'Negotiation', value: 'Negotiation' },
        { label: 'Closed Won', value: 'Closed Won' },
        { label: 'Closed Lost', value: 'Closed Lost' },
      ],
    },
  }),

  contactType: Property.StaticDropdown({
    displayName: 'Contact Type',
    required: false,
    options: {
      options: [
        { label: 'Person', value: 'Person' },
        { label: 'Company', value: 'Company' },
      ],
    },
  }),

  householdTitle: Property.StaticDropdown({
    displayName: 'Household Title',
    required: false,
    options: {
      options: [
        { label: 'Head', value: 'Head' },
        { label: 'Spouse', value: 'Spouse' },
        { label: 'Partner', value: 'Partner' },
        { label: 'Child', value: 'Child' },
        { label: 'Grandchild', value: 'Grandchild' },
        { label: 'Parent', value: 'Parent' },
        { label: 'Grandparent', value: 'Grandparent' },
        { label: 'Sibling', value: 'Sibling' },
        { label: 'Other Dependent', value: 'Other Dependent' },
      ],
    },
  }),
};
