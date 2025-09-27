import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { sendUploadedFileToExistingChat as sendUploadedFileToExistingChatProps } from '../common/properties';
import { sendUploadedFileToExistingChat as sendUploadedFileToExistingChatSchema } from '../common/schemas';
import { sendUploadedFileToExistingChat as sendUploadedFileToExistingChatMethod } from '../common/methods';

export const sendUploadedFileToExistingChat = createAction({
  auth: timelinesaiAuth,
  name: 'sendUploadedFileToExistingChat',
  displayName: 'Send Uploaded File to Existing Chat',
  description: 'Send a file (media/attachment) to a chat, with metadata like file name, via existing chat',
  props: sendUploadedFileToExistingChatProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      sendUploadedFileToExistingChatSchema
    );

    return await sendUploadedFileToExistingChatMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
