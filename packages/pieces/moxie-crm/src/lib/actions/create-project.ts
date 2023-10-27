import {
  Property,
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../..';

export const moxieCreateProjectAction = createAction({
  auth: moxieCRMAuth,
  name: 'create_project',
  description: 'Create a new project record',
  displayName: 'Create Project',
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
      required: true,
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
    retainerSchedule: Property.StaticDropdown({
      displayName: 'Retainer Schedule',
      required: false,
      options: {
        options: [
          {
            label: 'Weekly',
            value: 'WEEKLY',
          },
          {
            label: 'Bi Weekly',
            value: 'BI_WEEKLY',
          },
          {
            label: 'Monthly',
            value: 'MONTHLY',
          },
          {
            label: 'Quarterly',
            value: 'QUARTERLY',
          },
          {
            label: 'Bi Annually',
            value: 'BI_ANNUALLY',
          },
          {
            label: 'Annually',
            value: 'ANNUALLY',
          },
        ],
      },
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
    retainerStart: Property.DateTime({
      displayName: 'Retainer Start Date',
      description: 'Please enter date in YYYY-MM-DD format.',
      required: false,
    }),
    retainerTiming: Property.StaticDropdown({
      displayName: 'Retainer Timing',
      required: false,
      options: {
        options: [
          {
            label: 'Advanced',
            value: 'ADVANCED ',
          },
          {
            label: 'Arrears',
            value: 'ARREARS ',
          },
        ],
      },
    }),
    retainerOverageRate: Property.Number({
      displayName: 'Retainer Overage Rate',
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
      startDate,
      dueDate,
      portalAccess,
      showTimeWorkedInPortal,
      feeType,
      amount,
      retainerSchedule,
      estimateMax,
      estimateMin,
      retainerStart,
      retainerTiming,
      retainerOverageRate,
      taxable,
    } = propsValue;
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
        retainerSchedule,
        estimateMax,
        estimateMin,
        retainerStart,
        retainerTiming,
        retainerOverageRate,
        taxable,
      },
    });
  },
});
