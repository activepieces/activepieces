import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, getUserEmail } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailMime } from '../common/mime';

export const gmailCreateDraftAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_draft',
  displayName: 'Create Draft',
  description:
    'Create a new draft email (optionally inside an existing thread).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an unsent draft email with the given recipients, subject, body, and optional attachments, optionally placing it inside an existing thread. Use this when a message should be saved for later review or sending rather than sent immediately; send it afterwards with Send Draft. To attach the draft to a conversation, pass a thread ID from Search Email or Get Thread. Not idempotent: each call creates a separate draft.',
    idempotent: false,
  },
  props: {
    receiver: Property.Array({
      displayName: 'Receiver Email (To)',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC Email',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC Email',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'plain_text',
      options: {
        disabled: false,
        options: [
          { label: 'plain text', value: 'plain_text' },
          { label: 'html', value: 'html' },
        ],
      },
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Body for the draft email.',
      required: true,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email',
      description:
        "The address must be listed in your Gmail account's settings.",
      required: false,
    }),
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description:
        'Optional thread ID to attach this draft to an existing conversation (obtain from Search Email or Get Thread).',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'File to attach to the draft.',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Attachment Name',
          description: 'Optional name to override the attachment filename.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const receiver = (
        context.propsValue.receiver as string[] | undefined
      )?.filter((email) => email !== '');
      const cc = (context.propsValue.cc as string[] | undefined)?.filter(
        (email) => email !== ''
      );
      const bcc = (context.propsValue.bcc as string[] | undefined)?.filter(
        (email) => email !== ''
      );

      const senderEmail =
        context.propsValue.from ||
        (await getUserEmail(context.auth, authClient));
      const from = senderEmail
        ? context.propsValue.sender_name
          ? `${context.propsValue.sender_name} <${senderEmail}>`
          : senderEmail
        : undefined;

      const raw = await GmailMime.buildRawMessage({
        to: receiver,
        cc,
        bcc,
        from,
        subject: context.propsValue.subject,
        bodyType: context.propsValue.body_type as 'plain_text' | 'html',
        body: context.propsValue.body,
        attachments: context.propsValue.attachments as
          | { file: ApFile; name?: string }[]
          | undefined,
      });

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw,
            threadId: context.propsValue.thread_id || undefined,
          },
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to create a draft. Ensure the gmail.compose scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to create draft: ${error.message}`);
    }
  },
});
