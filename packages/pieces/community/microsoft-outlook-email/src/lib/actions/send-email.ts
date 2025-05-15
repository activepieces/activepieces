import { createAction, Property } from '@activepieces/pieces-framework';
import { outlookEmailAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendEmail = createAction({
  auth: outlookEmailAuth,
  name: 'send-email',
  displayName: 'Send Email',
  description: 'Action when sending email',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      required: true,
      description: 'Recipient email address',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
      description: 'Email subject',
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
      description: 'Email body content',
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'Files to attach to the email you want to send',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue, auth } = context;

    // Format attachments if available
    const formattedAttachments =
      propsValue.attachments?.map((file: any) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: file.name,
        contentType: file.mimeType,
        contentBytes: file.data.toString('base64'), // Convert file data to Base64
      })) || [];

    // Construct email payload
    const emailData = {
      message: {
        subject: propsValue.subject,
        body: {
          contentType: 'HTML',
          content: propsValue.body,
        },
        toRecipients: [
          {
            emailAddress: { address: propsValue.to },
          },
        ],
        attachments: formattedAttachments, // Attach files if any
      },
    };

    // Send email request
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://graph.microsoft.com/v1.0/me/sendMail',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: emailData,
    });
    return response.body;
  },
});
