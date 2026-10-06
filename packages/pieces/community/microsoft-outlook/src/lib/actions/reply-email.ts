import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { messageIdDropdown } from '../common/props';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { replyEmailActionOutputSchema } from '../output-schemas';

export const replyEmailAction = createAction({
  auth: microsoftOutlookAuth,
  name: 'reply-email',
  classification: 'WRITE',
  displayName: 'Reply to Email',
  description: 'Reply to an Outlook email, or save the reply as a draft.',
  audience: 'human',
  aiMetadata: { description: 'Replies to an existing Outlook message (identified by message ID), supporting added CC/BCC recipients and attachments. Set the Create Draft flag to stage the reply without sending; otherwise it is sent immediately. Not idempotent when sending: each call creates and dispatches a new reply.', idempotent: false },
  outputSchema: replyEmailActionOutputSchema,
  propertyGroups: [
    {
      key: 'recipients',
      display: 'tabs',
      label: 'Cc and Bcc',
      props: ['ccRecipients', 'bccRecipients'],
    },
  ],
  props: {
    messageId: messageIdDropdown({
      displayName: 'Email',
      description: 'The email to reply to.',
      required: true,
    }),
    bodyFormat: Property.StaticDropdown({
      displayName: 'Body Format',
      description: 'How the text in Body is interpreted.',
      required: true,
      defaultValue: 'text',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { label: 'Plain Text', value: 'text', description: 'Sent as written', icon: 'text' },
          { label: 'HTML', value: 'html', description: 'Tags are rendered', icon: 'code' },
        ],
      },
    }),
    replyBody: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
    ccRecipients: Property.Array({
      displayName: 'Cc',
      required: false,
    }),
    bccRecipients: Property.Array({
      displayName: 'Bcc',
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
          displayName: 'Attachment Name',
          description: 'Overrides the uploaded file name.',
          placeholder: 'report.pdf',
          required: false,
        }),
      },
    }),
    draft: Property.Checkbox({
      displayName: 'Save as Draft',
      description: 'Save the reply to Drafts instead of sending it.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { replyBody, bodyFormat, messageId, draft } = context.propsValue;
    const attachments = (context.propsValue.attachments ?? []) as Array<{
      file: ApFile;
      fileName: string;
    }>;
    const mailPayload: Message = {
      body: {
        content: replyBody,
        contentType: bodyFormat as BodyType,
      },
      ccRecipients: outlookCommon.toRecipients(context.propsValue.ccRecipients),
      bccRecipients: outlookCommon.toRecipients(context.propsValue.bccRecipients),
      attachments: attachments.map((attachment) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: attachment.fileName || attachment.file.filename,
        contentBytes: attachment.file.base64,
      })),
    };
    const client = outlookCommon.createClient(context.auth);
    try {
      const response: Message = await client
        .api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}/createReply`)
        .post({
          message: mailPayload,
        });
      const draftId = response.id;
      if (!draft) {
        await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${draftId}/send`).post({});
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
