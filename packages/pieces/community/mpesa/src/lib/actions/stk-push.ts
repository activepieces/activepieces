import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { mpesaAuth } from '../../index';

export const stkPush = createAction({
  name: 'stk-push',
  auth: mpesaAuth,
  displayName: 'STK Push',
  description: 'Prompt a customer phone to complete an M-Pesa payment',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Customer phone number e.g 254712345678',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount to charge in KES (must be a whole number)',
      required: true,
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL to receive payment confirmation',
      required: true,
    }),
    accountReference: Property.ShortText({
      displayName: 'Account Reference',
      description: 'Order ID or account number',
      required: true,
    }),
    transactionDesc: Property.ShortText({
      displayName: 'Transaction Description',
      description: 'Short description of the transaction',
      required: true,
    }),
  },
  async run(context) {
    const { consumerKey, consumerSecret, shortCode, passkey, environment } = context.auth.props;

    const baseUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    const accessToken = tokenResponse.body['access_token'];
    if (!accessToken) {
      throw new Error('Failed to obtain M-Pesa access token. Check your Consumer Key and Secret.');
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.floor(context.propsValue.amount),
        PartyA: context.propsValue.phoneNumber,
        PartyB: shortCode,
        PhoneNumber: context.propsValue.phoneNumber,
        CallBackURL: context.propsValue.callbackUrl,
        AccountReference: context.propsValue.accountReference,
        TransactionDesc: context.propsValue.transactionDesc,
      },
    });

    const data = response.body;
    if (data.ResponseCode !== '0') {
      throw new Error(`STK Push failed: ${data.ResponseDescription}`);
    }

    return data;
  },
});