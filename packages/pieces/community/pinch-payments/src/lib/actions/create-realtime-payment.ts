import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth, getPinchPaymentsToken } from '../common/auth';
import { listPayers } from '../common/client';

export const createRealtimePaymentAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'create_realtime_payment',
  displayName: 'Create Realtime Payment',
  description: 'Create a real-time payment against a credit card or bank account',
  props: {
    payerId: Property.Dropdown({
      displayName: 'Payer',
      description: 'Select an existing payer for this payment',
      required: false,
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
    useExistingPayer: Property.Checkbox({
      displayName: 'Use Existing Payer',
      description: 'Check if you want to use an existing payer instead of creating a new one',
      required: false,
      defaultValue: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'Full name of the payer (use this OR First Name + Last Name)',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the payer (use this OR Full Name)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the payer (use this OR Full Name)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the payer',
      required: false,
    }),
    mobileNumber: Property.ShortText({
      displayName: 'Mobile Number',
      description: 'Australian 10-digit mobile number (non-international)',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount (cents)',
      description: 'Payment amount in cents (e.g., $10.50 = 1050)',
      required: true,
    }),
    applicationFee: Property.Number({
      displayName: 'Application Fee (cents)',
      description: 'Optional additional fee in cents (Managed Merchants Only)',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional description for the payment (visible to payer, max 1000 characters)',
      required: false,
    }),
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      description: 'Existing payment source ID to use (leave empty to use default or create new source)',
      required: false,
    }),
    token: Property.ShortText({
      displayName: 'Payment Token',
      description: 'Credit card or bank account token from capture script (for new payment source)',
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
    nonce: Property.ShortText({
      displayName: 'Nonce',
      description: 'Optional one-time-use reference to prevent double submissions',
      required: false,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Free text field for storing state or accounting integration data',
      required: false,
    }),
  },
  async run(context) {
    const {
      payerId,
      useExistingPayer,
      fullName,
      firstName,
      lastName,
      email,
      mobileNumber,
      amount,
      applicationFee,
      description,
      sourceId,
      token,
      surcharge,
      nonce,
      metadata,
    } = context.propsValue;

    const paymentData: Record<string, unknown> = {
      amount,
    };

    // Add payer information
    if (useExistingPayer && payerId) {
      paymentData['payerId'] = payerId;
    } else {
      if (fullName) paymentData['fullName'] = fullName;
      if (firstName) paymentData['firstName'] = firstName;
      if (lastName) paymentData['lastName'] = lastName;
      if (email) paymentData['email'] = email;
      if (mobileNumber) paymentData['mobileNumber'] = mobileNumber;
    }

    // Add optional fields
    if (applicationFee) paymentData['applicationFee'] = applicationFee;
    if (description) paymentData['description'] = description;
    if (sourceId) paymentData['sourceId'] = sourceId;
    if (token) paymentData['token'] = token;
    if (surcharge && surcharge.length > 0) paymentData['surcharge'] = surcharge;
    if (nonce) paymentData['nonce'] = nonce;
    if (metadata) paymentData['metadata'] = metadata;

    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const tokenResponse = await getPinchPaymentsToken(credentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.getpinch.com.au/test/payments/realtime',
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
      body: paymentData,
    });

    return response.body;
  },
});
