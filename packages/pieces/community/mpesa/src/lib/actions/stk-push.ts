import { createAction, ExecutionType, Property } from '@activepieces/pieces-framework';
import { mpesaAuth, mpesaAuthValue } from '../auth';
import { amount, shortCode } from '../common/props';
import { darajaTimestamp, mpesaPost, normalizeKenyanPhone, positiveInteger } from '../common/client';
import { parseStkCallback } from '../common/callbacks';

type StkPushInitiationResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
};

export const stkPush = createAction({
  auth: mpesaAuth,
  name: 'stk_push',
  displayName: 'M-Pesa Express (STK Push)',
  description: 'Prompt a customer on their phone to authorize an M-Pesa payment.',
  audience: 'both',
  aiMetadata: {
    description: 'Initiates a customer checkout using M-Pesa Express and waits for Safaricom to return the final result. Each call creates a new payment request and is not safe to retry automatically.',
    idempotent: false,
  },
  props: {
    businessShortCode: shortCode,
    transactionType: Property.StaticDropdown({
      displayName: 'Transaction Type', required: true, defaultValue: 'CustomerPayBillOnline',
      options: { options: [
        { label: 'PayBill', value: 'CustomerPayBillOnline' },
        { label: 'Buy Goods (Till)', value: 'CustomerBuyGoodsOnline' },
      ] },
    }),
    amount,
    phoneNumber: Property.ShortText({ displayName: 'Customer Phone Number', required: true }),
    partyB: Property.ShortText({ displayName: 'Party B', description: 'Receiving short code. Usually the Business Short Code.', required: true }),
    accountReference: Property.ShortText({ displayName: 'Account Reference', required: true }),
    transactionDescription: Property.ShortText({ displayName: 'Transaction Description', required: true }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const auth = mpesaAuthValue(context.auth);
      const p = context.propsValue;
      const timestamp = darajaTimestamp();
      const phone = normalizeKenyanPhone(p.phoneNumber);
      if (!auth.lipaNaMpesaPasskey) throw new Error('Add the Lipa na M-Pesa Passkey to this M-Pesa connection before using STK Push.');
      const waitpoint = await context.run.createWaitpoint({ type: 'WEBHOOK' });
      const callbackUrl = waitpoint.buildResumeUrl({ queryParams: {} });
      const password = Buffer.from(`${p.businessShortCode}${auth.lipaNaMpesaPasskey}${timestamp}`).toString('base64');
      const initiation = await mpesaPost<StkPushInitiationResponse>(auth, '/mpesa/stkpush/v1/processrequest', {
        BusinessShortCode: p.businessShortCode, Password: password, Timestamp: timestamp,
        TransactionType: p.transactionType, Amount: positiveInteger(p.amount), PartyA: phone,
        PartyB: p.partyB, PhoneNumber: phone, CallBackURL: callbackUrl,
        AccountReference: p.accountReference, TransactionDesc: p.transactionDescription,
      });

      const output = {
        waitingForCallback: true,
        merchantRequestId: initiation.MerchantRequestID ?? null,
        checkoutRequestId: initiation.CheckoutRequestID ?? null,
        responseCode: initiation.ResponseCode ?? null,
        responseDescription: initiation.ResponseDescription ?? null,
        customerMessage: initiation.CustomerMessage ?? null,
      };
      context.run.waitForWaitpoint(waitpoint.id);
      return output;
    }

    const p = context.propsValue;
    return parseStkCallback(context.resumePayload.body, {
      businessShortCode: p.businessShortCode,
      transactionType: p.transactionType,
      amount: positiveInteger(p.amount),
      phoneNumber: normalizeKenyanPhone(p.phoneNumber),
      partyB: p.partyB,
      accountReference: p.accountReference,
      transactionDescription: p.transactionDescription,
    });
  },
});
