import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const sendMessage = createAction({
  auth: famulorAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send a message to an existing conversation and receive the assistant\'s reply.',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a message into an existing Famulor conversation (identified by its UUID) and get back the AI assistant\'s reply in the same call. Use to continue a chat thread you already created or retrieved; not idempotent, as each call appends a new message and generates a new reply.',
    idempotent: false,
  },
  props: famulorCommon.sendMessageProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.sendMessageSchema);

    return await famulorCommon.sendMessage({
      auth: auth.secret_text,
      uuid: propsValue.uuid as string,
      message: propsValue.message as string,
    });
  },
});
