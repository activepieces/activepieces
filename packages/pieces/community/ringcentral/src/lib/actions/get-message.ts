import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';

export const getMessage = createAction({
  auth: ringcentralAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description:
    'Retrieve a single SMS, MMS or voicemail message, including the list of attachments it carries.',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The message to read. The New Inbound SMS or MMS trigger emits this as `id`.',
      required: true,
    }),
  },
  async run(context) {
    const { messageId } = context.propsValue;

    // The webhook delivery already carries most of this, but not reliably the attachment list for an
    // MMS, and a flow that resumes from a stored id has nothing but the id. Reading the message back
    // is also how you discover the attachment ids that Download Message Attachment needs.
    return await ringcentralCommon.sendRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      resourcePath: `/restapi/v1.0/account/~/extension/~/message-store/${encodeURIComponent(
        messageId,
      )}`,
    });
  },
});
