import {
  Property,
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../..';

export const moxieCreateInvoiceAction = createAction({
  auth: moxieCRMAuth,
  name: 'create_invoice',
  description: 'Create a new invoice',
  displayName: 'Create Invoice',
  props: {
    clientName: Property.Dropdown({
      displayName: 'Client',
      required: false,
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
          options: clients.map((project) => {
            return {
              label: project.name,
              value: project.name,
            };
          }),
        };
      },
    }),
    templateName: Property.Dropdown({
      displayName: 'Invoice Template',
      required: false,
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
        const templates = await client.listInvoiceTemplates();
        return {
          disabled: false,
          options: templates.map((name) => {
            return {
              label: name,
              value: name,
            };
          }),
        };
      },
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Please enter date in YYYY-MM-DD format.',
      required: false,
    }),
    taxRate: Property.Number({
      displayName: 'Tax Rate',
      required: false,
      defaultValue: 0.0,
    }),
    discountPercent: Property.Number({
      displayName: 'Discount Percentage',
      required: false,
      defaultValue: 0.0,
    }),
    paymentInstructions: Property.LongText({
      displayName: 'Payment Instructions',
      required: false,
    }),
  },
  async run() {},
});
