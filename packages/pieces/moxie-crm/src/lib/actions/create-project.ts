import {
  Property,
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { makeClient, reformatDate } from '../common';
import { moxieCRMAuth } from '../..';

export const moxieCreateProjectAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_project',
  description: 'Creates a new project in moxie CRM.',
  displayName: 'Create a Project',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    clientName: Property.Dropdown({
      displayName: 'Client',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const client = await makeClient(
          auth as PiecePropValueSchema<typeof moxieCRMAuth>
        );
        const clients = await client.listClients();
        return {
          disabled: false,
          options: clients.map((client) => {
            return {
              label: client.name,
              value: client.name,
            };
          }),
        };
      },
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Please enter date in YYYY-MM-DD format.',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Please enter date in YYYY-MM-DD format.',
      required: false,
    }),
    portalAccess: Property.StaticDropdown({
      displayName: 'Client Portal Access',
      description: 'One of: None, Overview, Full access, or Read only.',
      required: true,
      defaultValue: 'Read Only',
      options: {
        options: [
          {
            label: 'Not Visible',
            value: 'None',
          },
          {
            label: 'Overview only',
            value: 'Overview',
          },
          {
            label: 'Read only project collaboration',
            value: 'Read only',
          },
          {
            label: 'Full project collaboration',
            value: 'Full access',
          },
        ],
      },
    }),
    showTimeWorkedInPortal: Property.Checkbox({
      displayName: 'Show time worked in portal ?',
      required: false,
      defaultValue: true,
    }),
    feeType: Property.StaticDropdown({
      displayName: 'Fee Type',
      description: 'One of: Hourly, Fixed Price, Retainer, Per Item.',
      required: true,
      options: {
        options: [
          {
            label: 'Hourly',
            value: 'Hourly',
          },
          {
            label: 'Fixed Price',
            value: 'Fixed Price',
          },
          {
            label: 'Retainer',
            value: 'Retainer',
          },
          {
            label: 'Per Item',
            value: 'Per Item',
          },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
      defaultValue: 0,
    }),
    estimateMax: Property.Number({
      displayName: 'Estimate maximum Amount',
      required: false,
      defaultValue: 0,
    }),
    estimateMin: Property.Number({
      displayName: 'Estimate minimum Amount',
      required: false,
      defaultValue: 0,
    }),
    taxable: Property.Checkbox({
      displayName: 'Is amount taxable ?',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      name,
      clientName,
      portalAccess,
      showTimeWorkedInPortal,
      feeType,
      amount,
      estimateMax,
      estimateMin,
      taxable,
    } = propsValue;
    const dueDate = reformatDate(propsValue.dueDate) as string;
    const startDate = reformatDate(propsValue.startDate) as string;
    const client = await makeClient(auth);
    return await client.createProject({
      name,
      clientName,
      startDate,
      dueDate,
      portalAccess,
      showTimeWorkedInPortal,
      feeSchedule: {
        feeType,
        amount,
        estimateMax,
        estimateMin,
        taxable,
      },
    });
  },
});
