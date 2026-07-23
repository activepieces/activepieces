import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, getUserEmail } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailMime } from '../common/mime';
import { gmailUpdateDraftActionOutputSchema } from '../output-schemas';

export const gmailUpdateDraftAction = createAction({
  auth: gmailAuth,
  name: 'gmail_update_draft',
  displayName: 'Update Draft',
  description: 'Replace the content of an existing draft email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing draft (subject, body, recipients, attachments) by its draft ID. Subject and body are required and replace the previous values; omitted recipients (To/CC) and the thread association are preserved from the existing draft rather than cleared. Obtain the draft ID from List Drafts. Not idempotent in effect: each call rewrites the draft with the supplied content.',
    idempotent: false,
  },
  props: {
    draft_id: Property.ShortText({
      displayName: 'Draft ID',
      description: 'The ID of the draft to update (obtain from List Drafts).',
      required: true,
    }),
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
      description: 'New body for the draft email.',
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
        'Optional thread ID to keep this draft attached to a conversation (obtain from Search Email or Get Thread).',
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
  outputSchema: gmailUpdateDraftActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      let receiver = (
        context.propsValue.receiver as string[] | undefined
      )?.filter((email) => email !== '');
      let cc = (context.propsValue.cc as string[] | undefined)?.filter(
        (email) => email !== ''
      );
      const bcc = (context.propsValue.bcc as string[] | undefined)?.filter(
        (email) => email !== ''
      );
      let threadId = context.propsValue.thread_id || undefined;

      // A draft update replaces the whole message, so recover the recipients
      // and thread link from the existing draft when the caller omits them —
      // otherwise editing only the body would silently strip the To/CC list
      // and detach the draft from its conversation.
      if (!receiver?.length || !cc?.length || !threadId) {
        const existing = await gmail.users.drafts.get({
          userId: 'me',
          id: context.propsValue.draft_id,
          format: 'metadata',
        });
        const message = existing.data.message;
        threadId = threadId ?? message?.threadId ?? undefined;
        const headerValues = (name: string) =>
          (message?.payload?.headers ?? [])
            .filter((header) => (header.name ?? '').toLowerCase() === name)
            .flatMap((header) => (header.value ?? '').split(','))
            .map((value) => value.trim())
            .filter((value) => value !== '');
        if (!receiver?.length) {
          const existingTo = headerValues('to');
          if (existingTo.length) receiver = existingTo;
        }
        if (!cc?.length) {
          const existingCc = headerValues('cc');
          if (existingCc.length) cc = existingCc;
        }
      }

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

      const response = await gmail.users.drafts.update({
        userId: 'me',
        id: context.propsValue.draft_id,
        requestBody: {
          message: {
            raw,
            threadId,
          },
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to update a draft. Ensure the gmail.compose scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Draft not found: "${context.propsValue.draft_id}". Use List Drafts to find a valid draft ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to update draft: ${error.message}`);
    }
  },
});
