import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth, getPinchPaymentsToken } from '../common/auth';
import { listPayers } from '../common/client';

export const createOrUpdateScheduledPaymentAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'create_or_update_scheduled_payment',
  displayName: 'Create or Update Scheduled Payment',
  description: 'Create a new scheduled payment or update an existing one',
  props: {
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'Enter an existing payment ID to update, or leave empty to create a new payment',
      required: false,
    }),
    payerId: Property.Dropdown({
      displayName: 'Payer',
      description: 'Select the payer for this scheduled payment',
      required: true,
      auth: pinchPaymentsAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }

        const credentials = auth.props as { username: string; password: string };
        const response = await listPayers(credentials, { pageSize: 500 });

        return {
          disabled: false,
          options: response.data.map((payer: { id: string; firstName: string; lastName: string; emailAddress: string }) => ({
            label: `${payer.firstName} ${payer.lastName || ''} (${payer.emailAddress})`.trim(),
            value: payer.id,
          })),
        };
      },
    }),
    amount: Property.Number({
      displayName: 'Amount (cents)',
      description: 'Payment amount in cents (e.g., $10.50 = 1050)',
      required: true,
    }),
    transactionDate: Property.DateTime({
      displayName: 'Transaction Date',
      description: 'The date to attempt the transaction',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional description for the payment (visible to payer, max 1000 characters)',
      required: false,
    }),
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      description: 'Optional: ID of the payment source to use. If omitted, the first valid source will be used',
      required: false,
    }),
    surcharge: Property.StaticMultiSelectDropdown({
      displayName: 'Surcharge Source Types',
      description: 'Select source types to surcharge (pass fees to customer)',
      required: false,
      options: {
        options: [
          { label: 'Bank Account', value: 'bank-account' },
          { label: 'Credit Card', value: 'credit-card' },
        ],
      },
    }),
    applicationFee: Property.Number({
      displayName: 'Application Fee (cents)',
      description: 'Optional additional fee in cents (Managed Merchants Only)',
      required: false,
    }),
    nonce: Property.ShortText({
      displayName: 'Nonce',
      description: 'Optional one-time-use reference to prevent double submissions',
      required: false,
    }),
  },
  async run(context) {
    const {
      paymentId,
      payerId,
      amount,
      transactionDate,
      description,
      sourceId,
      surcharge,
      applicationFee,
      nonce,
    } = context.propsValue;

    const paymentData: Record<string, unknown> = {
      payerId,
      amount,
      transactionDate: transactionDate.toString().split('T')[0], // Format as YYYY-MM-DD
    };

    // Add optional fields
    if (paymentId) paymentData['id'] = paymentId;
    if (description) paymentData['description'] = description;
    if (sourceId) paymentData['sourceId'] = sourceId;
    if (surcharge && surcharge.length > 0) paymentData['surcharge'] = surcharge;
    if (applicationFee) paymentData['applicationFee'] = applicationFee;
    if (nonce) paymentData['nonce'] = nonce;

    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const tokenResponse = await getPinchPaymentsToken(credentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.getpinch.com.au/test/payments',
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
      body: paymentData,
    });

    return response.body;
  },
});
