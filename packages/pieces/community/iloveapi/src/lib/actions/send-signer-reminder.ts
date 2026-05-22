import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';

export const sendSignerReminderAction = createAction({
  auth: iloveapiAuth,
  name: 'send_signer_reminder',
  displayName: 'Send Signer Reminder',
  description:
    'Email a reminder to signers who have not yet completed the signature. Limited to 2 calls per day.',
  props: {
    token_requester: Property.ShortText({
      displayName: 'Requester Token',
      description: 'The "token_requester" of the signature request.',
      required: true,
    }),
  },
  async run(context) {
    const { token_requester } = context.propsValue;
    if (!token_requester) {
      throw new Error('Requester Token is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    return await iLoveApi.sendSignerReminder({
      token,
      tokenRequester: token_requester,
    });
  },
});
