import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, getUserEmail } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailMime } from '../common/mime';
import { parseStream } from '../common/data';

export const gmailForwardMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_forward_message',
  displayName: 'Forward Message',
  description: 'Forward an existing email to new recipients.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Forwards an existing email to one or more new recipients, quoting the original sender, subject, and body beneath an optional added note. Requires the Gmail message ID of the email to forward (obtain from Search Email or Get Message). Performs two calls: it fetches the original message, then sends the forwarded copy. Not idempotent: each call sends a new forwarded message.',
    idempotent: false,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID to forward (obtain from Search Email or Get Message).',
      required: true,
    }),
    receiver: Property.Array({
      displayName: 'Receiver Email (To)',
      description: 'One or more recipients to forward the email to.',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC Email',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC Email',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional message to add above the forwarded content.',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      required: false,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const original = await gmail.users.messages.get({
        userId: 'me',
        id: context.propsValue.message_id,
        format: 'raw',
      });

      if (!original.data.raw) {
        throw new Error('Could not fetch the original message to forward.');
      }

      const parsed = await parseStream(
        Buffer.from(original.data.raw, 'base64').toString('utf-8')
      );

      const originalSubject = parsed.subject || '';
      const forwardSubject = originalSubject.toLowerCase().startsWith('fwd:')
        ? originalSubject
        : `Fwd: ${originalSubject}`;

      const originalFrom =
        typeof parsed.from?.text === 'string' ? parsed.from.text : '';
      const originalTo =
        parsed.to && !Array.isArray(parsed.to) ? parsed.to.text : '';
      const originalDate = parsed.date ? parsed.date.toUTCString() : '';

      const note = context.propsValue.note
        ? `${context.propsValue.note}\n\n`
        : '';
      const htmlAsText = parsed.html ? parsed.html.replace(/<[^>]*>/g, '') : '';
      const originalBody = parsed.text || htmlAsText || '';
      const quotedBody = originalBody
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      const forwardedBody =
        `${note}---------- Forwarded message ----------\n` +
        `From: ${originalFrom}\n` +
        `Date: ${originalDate}\n` +
        `Subject: ${originalSubject}\n` +
        `To: ${originalTo}\n\n` +
        `${quotedBody}`;

      const receiver = (context.propsValue.receiver as string[]).filter(
        (email) => email !== ''
      );
      const cc = (context.propsValue.cc as string[] | undefined)?.filter(
        (email) => email !== ''
      );
      const bcc = (context.propsValue.bcc as string[] | undefined)?.filter(
        (email) => email !== ''
      );

      const senderEmail = await getUserEmail(context.auth, authClient);
      const from = senderEmail
        ? context.propsValue.sender_name
          ? `${context.propsValue.sender_name} <${senderEmail}>`
          : senderEmail
        : undefined;

      const forwardedAttachments = (parsed.attachments || [])
        .filter((attachment) => attachment.content)
        .map((attachment) => ({
          file: new ApFile(
            attachment.filename ?? `attachment-${Date.now()}`,
            Buffer.from(attachment.content),
            attachment.filename?.split('.').pop()
          ),
          name: attachment.filename ?? undefined,
        }));

      const raw = await GmailMime.buildRawMessage({
        to: receiver,
        cc,
        bcc,
        from,
        subject: forwardSubject,
        bodyType: 'plain_text',
        body: forwardedBody,
        attachments: forwardedAttachments,
      });

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to forward the message. Ensure the gmail.send and gmail.readonly scopes are granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Original message not found: "${context.propsValue.message_id}". Use Search Email to find a valid message ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to forward message: ${error.message}`);
    }
  },
});
