import { createAction, Property } from '@activepieces/pieces-framework';
import { outlookEmailAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const downloadAttachment = createAction({
  auth: outlookEmailAuth,
  name: 'download-attachment',
  displayName: 'Download Attachment',
  description: 'Download attachments from an Outlook email message',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      required: true,
      description: 'The ID of the email message containing attachments',
    }),
  },

  async run(context) {
    const { propsValue, auth, files } = context;
    const { messageId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const attachments = response.body.value || [];
    const savedFiles = [];

    for (const attachment of attachments) {
      if (
        attachment['@odata.type'] === '#microsoft.graph.fileAttachment' &&
        attachment.contentBytes
      ) {
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(attachment.contentBytes, 'base64');

        // Save file using FilesService
        const savedFile = await files.write({
          fileName: attachment.name,
          data: fileBuffer,
        });

        savedFiles.push({
          filename: attachment.name,
          fileId: savedFile,
          contentType: attachment.contentType,
          size: attachment.size,
          lastModified: attachment.lastModifiedDateTime,
        });
      }
    }

    return {
      attachmentCount: savedFiles.length,
      attachments: savedFiles,
    };
  },
});
