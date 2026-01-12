import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const createProjectAction = createAction({
  auth: bexioAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project',
  props: {
    document_nr: Property.ShortText({
      displayName: 'Document Number',
      description: 'Project number (required if automatic numbering is disabled)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Project start date',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'Project end date',
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Project comment/description',
      required: false,
    }),
    pr_state_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Project Status',
      description: 'Status of the project',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const states = await client.get<Array<{ id: number; name: string }>>('/2.0/pr_project_state');

          return {
            disabled: false,
            options: states.map((state) => ({
              label: state.name,
              value: state.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load project statuses',
            options: [],
          };
        }
      },
    }),
    pr_project_type_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Project Type',
      description: 'Type of project',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const types = await client.get<Array<{ id: number; name: string }>>('/2.0/pr_project_type');

          return {
            disabled: false,
            options: types.map((type) => ({
              label: type.name,
              value: type.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load project types',
            options: [],
          };
        }
      },
    }),
    contact_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Contact',
      description: 'Contact associated with this project',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const contacts = await client.get<Array<{
            id: number;
            contact_type_id: number;
            name_1: string;
            name_2?: string | null;
            nr?: string | null;
          }>>('/2.0/contact');

          return {
            disabled: false,
            options: contacts.map((contact) => {
              const name = contact.name_2
                ? `${contact.name_2} ${contact.name_1}`
                : contact.name_1;
              const label = contact.nr ? `${name} (#${contact.nr})` : name;
              return {
                label,
                value: contact.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    contact_sub_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Contact Sub',
      description: 'Contact sub-address (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const contacts = await client.get<Array<{
            id: number;
            contact_type_id: number;
            name_1: string;
            name_2?: string | null;
            nr?: string | null;
          }>>('/2.0/contact');

          return {
            disabled: false,
            options: contacts.map((contact) => {
              const name = contact.name_2
                ? `${contact.name_2} ${contact.name_1}`
                : contact.name_1;
              const label = contact.nr ? `${name} (#${contact.nr})` : name;
              return {
                label,
                value: contact.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    pr_invoice_type_id: Property.StaticDropdown({
      displayName: 'Invoice Type',
      description: 'Type of invoicing for this project',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Hourly rate for client services', value: 1 },
          { label: 'Hourly rate for employee', value: 2 },
          { label: 'Hourly rate for project', value: 3 },
          { label: 'Fix price for project', value: 4 },
        ],
      },
    }),
    pr_invoice_type_amount: Property.ShortText({
      displayName: 'Invoice Type Amount',
      description: 'Amount for invoice type (only for hourly rate project or fix price)',
      required: false,
    }),
    pr_budget_type_id: Property.StaticDropdown({
      displayName: 'Budget Type',
      description: 'Type of budget for this project',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Total budget costs', value: 1 },
          { label: 'Total budget hours', value: 2 },
          { label: 'Budget for each client services', value: 3 },
          { label: 'Budget for each employee', value: 4 },
        ],
      },
    }),
    pr_budget_type_amount: Property.ShortText({
      displayName: 'Budget Type Amount',
      description: 'Amount for budget type (only for total budget costs or total budget hours)',
      required: false,
    }),
    user_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'User',
      description: 'User responsible for this project',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const users = await client.get<Array<{
            id: number;
            firstname?: string | null;
            lastname?: string | null;
            email: string;
          }>>('/3.0/users');

          return {
            disabled: false,
            options: users.map((user) => {
              const name = user.firstname && user.lastname
                ? `${user.firstname} ${user.lastname}`
                : user.email;
              return {
                label: name,
                value: user.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load users',
            options: [],
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const props = propsValue;

    const requestBody: Record<string, unknown> = {
      name: props['name'],
      pr_state_id: props['pr_state_id'],
      pr_project_type_id: props['pr_project_type_id'],
      contact_id: props['contact_id'],
      user_id: props['user_id'],
    };

    if (props['document_nr']) {
      requestBody['document_nr'] = props['document_nr'];
    }
    if (props['start_date']) {
      // Convert DateTime to ISO string format expected by API
      const startDate = props['start_date'] as string;
      requestBody['start_date'] = startDate;
    }
    if (props['end_date']) {
      // Convert DateTime to ISO string format expected by API
      const endDate = props['end_date'] as string;
      requestBody['end_date'] = endDate;
    }
    if (props['comment']) {
      requestBody['comment'] = props['comment'];
    }
    if (props['contact_sub_id']) {
      requestBody['contact_sub_id'] = props['contact_sub_id'];
    }
    if (props['pr_invoice_type_id']) {
      requestBody['pr_invoice_type_id'] = props['pr_invoice_type_id'];
    }
    if (props['pr_invoice_type_amount']) {
      requestBody['pr_invoice_type_amount'] = props['pr_invoice_type_amount'];
    }
    if (props['pr_budget_type_id']) {
      requestBody['pr_budget_type_id'] = props['pr_budget_type_id'];
    }
    if (props['pr_budget_type_amount']) {
      requestBody['pr_budget_type_amount'] = props['pr_budget_type_amount'];
    }

    const response = await client.post<{
      id: number;
      uuid: string;
      nr: string;
      name: string;
      pr_state_id: number;
      pr_project_type_id: number;
      contact_id: number;
      user_id: number;
    }>('/2.0/pr_project', requestBody);

    return response;
  },
});

