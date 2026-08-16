import { createAction, ExecutionType, Property } from '@activepieces/pieces-framework';
import { mpesaAuth, mpesaAuthValue } from '../auth';
import { amount, initiatorName } from '../common/props';
import { mpesaPost, positiveInteger } from '../common/client';
import { parseTransactionCallback } from '../common/callbacks';

type TransactionInitiationResponse = {
  ConversationID?: string;
  OriginatorConversationID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
};

export const b2bPayment = createAction({
  auth: mpesaAuth,
  name: 'b2b_payment',
  displayName: 'B2B: Send Payment',
  description: 'Transfer funds from one M-Pesa business short code to another.',
  audience: 'both',
  aiMetadata: {
    description: 'Initiates one transfer between M-Pesa business shortcodes and waits for the Daraja result. Each call creates a new transfer and is not safe to retry automatically.',
    idempotent: false,
  },
  props: {
    initiatorName,
    commandId: Property.StaticDropdown({ displayName: 'Transfer Type', required: true, defaultValue: 'BusinessPayBill', options: { options: [
      { label: 'Business PayBill', value: 'BusinessPayBill' },
      { label: 'Business Buy Goods', value: 'BusinessBuyGoods' },
      { label: 'Disburse Funds To Business', value: 'DisburseFundsToBusiness' },
      { label: 'Business To Business Transfer', value: 'BusinessToBusinessTransfer' },
    ] } }),
    senderIdentifierType: Property.StaticDropdown({ displayName: 'Sender Identifier Type', required: true, defaultValue: '4', options: { options: [
      { label: 'Short Code (4)', value: '4' },
    ] } }),
    receiverIdentifierType: Property.StaticDropdown({ displayName: 'Receiver Identifier Type', required: true, defaultValue: '4', options: { options: [
      { label: 'Short Code (4)', value: '4' },
    ] } }),
    amount,
    partyA: Property.ShortText({ displayName: 'Sender Short Code', required: true }),
    partyB: Property.ShortText({ displayName: 'Receiver Short Code', required: true }),
    accountReference: Property.ShortText({ displayName: 'Account Reference', required: true }),
    remarks: Property.ShortText({ displayName: 'Remarks', required: true }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const p = context.propsValue;
      const auth = mpesaAuthValue(context.auth);
      if (!auth.securityCredential) throw new Error('Add the encrypted B2C/B2B Security Credential to this M-Pesa connection.');
      const waitpoint = await context.run.createWaitpoint({ type: 'WEBHOOK' });
      const resultUrl = waitpoint.buildResumeUrl({ queryParams: { event: 'result' } });
      const timeoutUrl = waitpoint.buildResumeUrl({ queryParams: { event: 'timeout' } });
      const initiation = await mpesaPost<TransactionInitiationResponse>(auth, '/mpesa/b2b/v1/paymentrequest', {
        Initiator: p.initiatorName, SecurityCredential: auth.securityCredential, CommandID: p.commandId,
        SenderIdentifierType: p.senderIdentifierType, ReceiverIdentifierType: p.receiverIdentifierType,
        Amount: positiveInteger(p.amount), PartyA: p.partyA, PartyB: p.partyB,
        AccountReference: p.accountReference, Remarks: p.remarks,
        QueueTimeOutURL: timeoutUrl, ResultURL: resultUrl,
      });
      const output = {
        waitingForCallback: true,
        conversationId: initiation.ConversationID ?? null,
        originatorConversationId: initiation.OriginatorConversationID ?? null,
        responseCode: initiation.ResponseCode ?? null,
        responseDescription: initiation.ResponseDescription ?? null,
      };
      context.run.waitForWaitpoint(waitpoint.id);
      return output;
    }

    const event = context.resumePayload.queryParams['event'] === 'timeout' ? 'timeout' : 'result';
    return parseTransactionCallback(context.resumePayload.body, event);
  },
});
