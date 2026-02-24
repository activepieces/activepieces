import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth, getPinchPaymentsToken } from '../common/auth';
import { listPayers } from '../common/client';

export const addSourceToPayerAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'add_source_to_payer',
  displayName: 'Add Source to Payer',
  description: 'Add a payment source (bank account or credit card) to an existing payer',
  props: {
    payerId: Property.Dropdown({
      displayName: 'Payer',
      description: 'Select the payer to add a payment source to',
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
    sourceType: Property.StaticDropdown({
      displayName: 'Source Type',
      description: 'Type of payment source to add',
      required: true,
      options: {
        options: [
          { label: 'Bank Account', value: 'bank-account' },
          { label: 'Credit Card', value: 'credit-card' },
        ],
      },
    }),
    useToken: Property.Checkbox({
      displayName: 'Use Token',
      description: 'Use a token from the capture script instead of manual bank account details',
      required: false,
      defaultValue: true,
    }),
    token: Property.ShortText({
      displayName: 'Payment Token',
      description: 'The token created by the Pinch capture script (for both bank accounts and credit cards)',
      required: false,
    }),
    ipAddress: Property.ShortText({
      displayName: 'IP Address',
      description: 'IP address of the payer (required for token-based sources)',
      required: false,
    }),
    bankAccountNumber: Property.ShortText({
      displayName: 'Bank Account Number',
      description: 'The bank account number (only for manual bank account entry)',
      required: false,
    }),
    bankAccountBsb: Property.ShortText({
      displayName: 'BSB',
      description: 'The BSB (Bank-State-Branch) number (only for manual bank account entry)',
      required: false,
    }),
    bankAccountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'The name on the bank account (only for manual bank account entry)',
      required: false,
    }),
  },
  async run(context) {
    const {
      payerId,
      sourceType,
      useToken,
      token,
      ipAddress,
      bankAccountNumber,
      bankAccountBsb,
      bankAccountName,
    } = context.propsValue;

    const sourceData: Record<string, unknown> = {
      sourceType,
    };

    if (useToken) {
      if (!token) {
        throw new Error('Token is required when using token-based payment source');
      }
      sourceData['token'] = token;
      if (ipAddress) sourceData['ipAddress'] = ipAddress;
    } else {
      if (sourceType === 'bank-account') {
        if (!bankAccountNumber || !bankAccountBsb || !bankAccountName) {
          throw new Error('Bank account number, BSB, and account name are required for manual bank account entry');
        }
        sourceData['bankAccountNumber'] = bankAccountNumber;
        sourceData['bankAccountBsb'] = bankAccountBsb;
        sourceData['bankAccountName'] = bankAccountName;
      } else {
        throw new Error('Manual entry is only supported for bank accounts. Credit cards must use tokens.');
      }
    }

    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const tokenResponse = await getPinchPaymentsToken(credentials);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.getpinch.com.au/test/payers/${payerId}/sources`,
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
      body: sourceData,
    });

    return response.body;
  },
});
