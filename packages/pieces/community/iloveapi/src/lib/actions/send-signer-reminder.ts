import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import { iloveSchemas } from '../common/schemas';

export const sendSignerReminderAction = createAction({
  auth: iloveapiAuth,
  name: 'send_signer_reminder',
  classification: 'WRITE',
  displayName: 'Send Signer Reminder',
  description:
    'Email a reminder to signers who have not yet completed the signature. Limited to 2 calls per day.',
  audience: 'both',
  outputSchema: iloveSchemas.signatureAck,
  aiMetadata: {
    description:
      'Send a manual nudge email to outstanding signers of an existing signature request, identified by its requester token. Each call sends a fresh reminder (not idempotent) and the provider caps this at 2 calls per day per request; for scheduled automatic reminders configure them on the request itself at creation time instead.',
    idempotent: false,
  },
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description: 'The "token_requester" of the signature request.',
      required: true,
    }),
  },
  async run(context) {
    const tokenRequester = (context.propsValue.token_requester ?? '').trim();
    if (!tokenRequester) {
      throw new Error('Requester Token is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    const response = await iLoveApi.sendSignerReminder({ token, tokenRequester });
    return {
      ...response,
      success: true,
      token_requester: tokenRequester,
    };
  },
});
