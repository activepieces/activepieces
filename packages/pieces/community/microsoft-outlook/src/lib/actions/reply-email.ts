import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { Client } from '@microsoft/microsoft-graph-client';

export const replyEmailAction = createAction({
  auth: microsoftOutlookAuth,
  name: 'reply-email',
  displayName: 'Reply to Email',
  description: 'Reply to an outlook email.',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      required: true,
    }),
    bodyFormat: Property.StaticDropdown({
      displayName: 'Body Format',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    replyBody: Property.LongText({
      displayName: 'Reply Body',
      required: true,
    }),
    ccRecipients: Property.Array({
      displayName: 'CC Recipients',
      required: false,
    }),
    bccRecipients: Property.Array({
      displayName: 'BCC Recipients',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      defaultValue: [],
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
        fileName: Property.ShortText({
          displayName: 'File Name',
          required: false,
        }),
      },
    }),
    draft: Property.Checkbox({
      displayName: 'Create Draft',
      description: 'If enabled, creates draft without sending.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { replyBody, bodyFormat, messageId, draft } = context.propsValue;
    const ccRecipients = context.propsValue.ccRecipients as string[];
    const bccRecipients = context.propsValue.bccRecipients as string[];
    const attachments = context.propsValue.attachments as Array<{
      file: ApFile;
      fileName: string;
    }>;
    const mailPayload: Message = {
      body: {
        content: replyBody,
        contentType: bodyFormat as BodyType,
      },
      ccRecipients: ccRecipients.map((mail) => ({
        emailAddress: {
          address: mail,
        },
      })),
      bccRecipients: bccRecipients.map((mail) => ({
        emailAddress: {
          address: mail,
        },
      })),
      attachments: attachments.map((attachment) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: attachment.fileName || attachment.file.filename,
        contentBytes: attachment.file.base64,
      })),
    };
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    try {
      const response: Message = await client
        .api(`/me/messages/${messageId}/createReply`)
        .post({
          message: mailPayload,
        });
      const draftId = response.id;
      if (!draft) {
        await client.api(`/me/messages/${draftId}/send`).post({});
        return {
          success: true,
          message: 'Reply sent successfully.',
          draftId: draftId,
        };
      }
      return {
        success: true,
        message: 'Draft created successfully.',
        draftId: draftId,
        draftLink: `https://outlook.office.com/mail/drafts/id/${draftId}`,
      };
    } catch (error) {
      console.error('Reply Email Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(errorMessage);
    }
  },
});
