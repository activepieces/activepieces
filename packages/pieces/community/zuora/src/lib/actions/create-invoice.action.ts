import { zuoraAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const createInvoiceAction = createAction({
  auth: zuoraAuth,
  name: 'create-invoice',
  displayName: 'Create Invoice',
  description: 'Create a standalone invoice.',
  props: {
    accountNumber: Property.ShortText({
      displayName: 'Customer Account Number',
      description:
        'The number of the customer account associated with the invoice.',
      required: true,
    }),
    autoPay: Property.Checkbox({
      displayName: 'Auto Pay?',
      description:
        'Whether invoices are automatically picked up for processing in the corresponding payment run.',
      required: false,
    }),
    comments: Property.LongText({
      displayName: 'Comments',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Provide YYYY-MM-DD format.',
      required: true,
    }),
    invoiceDate: Property.DateTime({
      displayName: 'Invoice Date',
      required: true,
      description: 'Provide YYYY-MM-DD format.',
    }),
    invoiceItems: Property.Array({
      displayName: 'Invoice Items',
      required: false,
      properties: {
        productRatePlanChargeId: Property.ShortText({
          displayName: 'Product Rate Plan Charge ID',
          description:
            'The ID of the product rate plan charge that the invoice item is created from.You can use `Find Product Rate Plan` action to search associate rate plan charge.',
          required: true,
        }),
        amount: Property.Number({
          displayName: 'Amount',
          required: true,
        }),
        description: Property.LongText({
          displayName: 'Description',
          required: false,
        }),
        purchaseOrderNumber: Property.ShortText({
          displayName: 'Purchase Order Number',
          required: false,
        }),
        quantity: Property.ShortText({
          displayName: 'Quantity',
          required: false,
        }),
        serviceStartDate: Property.ShortText({
          displayName: 'Service Start Date',
          description: 'Provide YYYY-MM-DD format.',
          required: true,
        }),
        serviceEndDate: Property.ShortText({
          displayName: 'Service End Date',
          description: 'Provide YYYY-MM-DD format.',
          required: false,
        }),
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'Draft',
      options: {
        disabled: false,
        options: [
          { label: 'Draft', value: 'Draft' },
          { label: 'Posted', value: 'Posted' },
        ],
      },
    }),
  },
  async run(context) {
    const { accountNumber, autoPay, comments, dueDate, invoiceDate, status } =
      context.propsValue;

    const invoiceItems = context.propsValue.invoiceItems as InvoiceItemInput[];

    const token = await getAccessToken(context.auth);

    const body = {
      accountNumber,
      autoPay,
      comments,
      dueDate,
      invoiceDate,
      status,
      invoiceItems,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${context.auth.environment}/v1/invoices`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body,
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});

type InvoiceItemInput = {
  productRatePlanChargeId: string;
  amount: string;
  description: string;
  purchaseOrderNumber: string;
  quantity: string;
  serviceStartDate: string;
  serviceEndDate: string;
};
