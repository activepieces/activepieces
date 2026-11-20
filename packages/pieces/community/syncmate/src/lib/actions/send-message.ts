import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { syncmateRequest } from '../common/client';
import { assertSendable, cleanPhone, RecipientType, singleBody, standardMessage } from '../common/payload';
import { collectMedia, syncmateProps } from '../common/props';

export const sendMessageAction = createAction({
  auth: syncmateAuth,
  name: 'sendMessage',
  displayName: 'Send Message to Contact',
  description: 'Send a WhatsApp message, with optional attachments, to a phone number from your QR-connected number.',
  props: {
    number: syncmateProps.phone(),
    message: syncmateProps.message(false),
    file: syncmateProps.attachments.file,
    fileUrl: syncmateProps.attachments.fileUrl,
    fileName: syncmateProps.attachments.fileName,
    media: syncmateProps.attachments.media,
  },
  async run({ auth, propsValue }) {
    const message = standardMessage({
      number: cleanPhone(propsValue.number),
      message: propsValue.message,
      type: RecipientType.CONTACT,
      media: await collectMedia(propsValue),
    });
    assertSendable(message, 'recipient phone number');

    return syncmateRequest({ auth, method: HttpMethod.POST, path: '/v1/message', body: singleBody(message) });
  },
});
