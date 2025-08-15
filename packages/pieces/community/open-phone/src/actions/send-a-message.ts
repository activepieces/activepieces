import { createAction, Property } from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { OpenPhoneAPI, Message } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendMessageAction = createAction({
  auth: openphoneAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send SMS/MMS from a specified number to a recipient',
  props: {
    from: Property.ShortText({
      displayName: 'From Phone Number',
      description: 'The phone number to send from (must be an OpenPhone number)',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Phone Number',
      description: 'The recipient phone number',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The text content of the message',
      required: true,
    }),
    mediaUrls: Property.Array({
      displayName: 'Media URLs',
      description: 'URLs of media files to attach (for MMS)',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, body, mediaUrls } = context.propsValue;
    const api = new OpenPhoneAPI(context.auth);

    const messageData = {
      from,
      to,
      body,
      ...(mediaUrls && mediaUrls.length > 0 && { mediaUrls })
    };

    const result = await api.makeRequest<Message>(HttpMethod.POST, '/messages', messageData);
    
    return {
      success: true,
      message: result
    };
  },
});