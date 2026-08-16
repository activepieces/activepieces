import { createAction, ExecutionType, Property } from '@activepieces/pieces-framework';
import { mpesaAuth, mpesaAuthValue } from '../auth';
import { amount, initiatorName, shortCode } from '../common/props';
import { mpesaPost, normalizeKenyanPhone, positiveInteger } from '../common/client';
import { parseTransactionCallback } from '../common/callbacks';

type TransactionInitiationResponse = {
  ConversationID?: string;
  OriginatorConversationID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
};

export const b2cPayment = createAction({
  auth: mpesaAuth,
  name: 'b2c_payment',
  displayName: 'B2C: Send Payment',
  description: 'Send an M-Pesa payment from an organization to a customer.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends one B2C payment from an organization shortcode to a customer and waits for the Daraja result. Each call initiates a new disbursement and is not safe to retry automatically.',
    idempotent: false,
  },
  props: {
    initiatorName,
    commandId: Property.StaticDropdown({ displayName: 'Payment Type', required: true, defaultValue: 'BusinessPayment', options: { options: [
      { label: 'Business Payment', value: 'BusinessPayment' },
      { label: 'Salary Payment', value: 'SalaryPayment' },
      { label: 'Promotion Payment', value: 'PromotionPayment' },
    ] } }),
    amount,
    partyA: shortCode,
    partyB: Property.ShortText({ displayName: 'Recipient Phone Number', required: true }),
    remarks: Property.ShortText({ displayName: 'Remarks', required: true }),
    occasion: Property.ShortText({ displayName: 'Occasion', required: false }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      const p = context.propsValue;
      const auth = mpesaAuthValue(context.auth);
      if (!auth.securityCredential) throw new Error('Add the encrypted B2C/B2B Security Credential to this M-Pesa connection.');
      const waitpoint = await context.run.createWaitpoint({ type: 'WEBHOOK' });
      const resultUrl = waitpoint.buildResumeUrl({ queryParams: { event: 'result' } });
      const timeoutUrl = waitpoint.buildResumeUrl({ queryParams: { event: 'timeout' } });
      const initiation = await mpesaPost<TransactionInitiationResponse>(auth, '/mpesa/b2c/v1/paymentrequest', {
        InitiatorName: p.initiatorName, SecurityCredential: auth.securityCredential, CommandID: p.commandId,
        Amount: positiveInteger(p.amount), PartyA: p.partyA, PartyB: normalizeKenyanPhone(p.partyB),
        Remarks: p.remarks, QueueTimeOutURL: timeoutUrl, ResultURL: resultUrl,
        Occasion: p.occasion ?? '',
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
