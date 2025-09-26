import { createAction, Property } from '@activepieces/pieces-framework';

export const sendUploadedFileToExistingChat = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendUploadedFileToExistingChat',
  displayName: 'Send Uploaded File to Existing Chat',
  description: 'Send a file (media/attachment) to a chat, with metadata like file name, via existing chat.',
  props: {},
  async run() {
    // Action logic here
  },
});
