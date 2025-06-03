import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL, outlookAuth } from '../common/common';

export const downloadEmailAttachment = createAction({
  auth: outlookAuth,
  name: 'downloadEmailAttachment',
  displayName: 'Download email Attachment',
  description: 'Download attachments from a specific email message',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message containing the attachment',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { messageId } = propsValue;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${BASE_URL}/me/messages/${messageId}/attachments`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'json', // Use 'json' to get the attachment metadata
    };

    const response = await httpClient.sendRequest(request);

    if (response.status !== 200) {
      throw new Error(`Failed to download attachment: ${response.status}`);
    }

    const attachments = response.body.value;
    if (!attachments || attachments.length === 0) {
      throw new Error('No attachments found for the specified message ID');
    }

    return {
      messageId: messageId,
      attachments: attachments.map((attachment: any) => ({
        id: attachment.id,
        name: attachment.name,
        contentType: attachment.contentType,
        size: attachment.size,
        data: attachment.contentBytes,
      })),
    };
  },
});
