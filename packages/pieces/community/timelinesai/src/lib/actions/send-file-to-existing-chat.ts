import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { sendFileToExistingChat as sendFileToExistingChatProps } from '../common/properties';
import { sendFileToExistingChat as sendFileToExistingChatSchema } from '../common/schemas';
import { sendFileToExistingChat as sendFileToExistingChatMethod } from '../common/methods';

export const sendFileToExistingChat = createAction({
  auth: timelinesaiAuth,
  name: 'sendFileToExistingChat',
  displayName: 'Send File to Existing Chat',
  description: 'Send a file (media/attachment) to a chat using URL or file input',
  props: sendFileToExistingChatProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      sendFileToExistingChatSchema
    );

    return await sendFileToExistingChatMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
