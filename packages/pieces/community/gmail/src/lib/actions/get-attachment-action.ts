import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailGetAttachmentActionOutputSchema } from '../output-schemas';

export const gmailGetAttachmentAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_attachment',
  displayName: 'Get Attachment',
  description: 'Download an email attachment by message ID and attachment ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Fetches one email attachment's raw bytes by message ID + attachment ID, returning a stored file plus size. Note: Get Message already returns each attachment's downloaded content directly, so prefer that; use this only when you separately hold a raw Gmail attachment ID (from the message payload parts) and need the bytes on their own. Get the message ID from Search Email. Idempotent: a read-only fetch that does not modify the mailbox.",
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID the attachment belongs to (obtain from Search Email or Get Message).',
      required: true,
    }),
    attachment_id: Property.ShortText({
      displayName: 'Attachment ID',
      description:
        'The raw Gmail attachment ID, taken from the message payload parts (parts[].body.attachmentId of a full-format message). Note: Get Message returns attachment content directly, so this field is only needed for the raw-ID fetch path.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Optional name to give the downloaded file.',
      required: false,
    }),
  },
  outputSchema: gmailGetAttachmentActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: context.propsValue.message_id,
        id: context.propsValue.attachment_id,
      });

      const data = response.data.data;
      if (!data) {
        throw new Error('Attachment returned no data.');
      }

      const fileName =
        context.propsValue.file_name ||
        `attachment-${context.propsValue.attachment_id}`;
      const fileUrl = await context.files.write({
        fileName,
        data: Buffer.from(data, 'base64'),
      });

      return {
        fileName,
        size: response.data.size,
        data: fileUrl,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to read the attachment. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          'Attachment or message not found. Verify the message ID and attachment ID via Get Message.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to get attachment: ${error.message}`);
    }
  },
});
