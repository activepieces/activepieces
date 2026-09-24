import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  gmailAuth,
  createGoogleClient,
  getAccessToken,
  getUserEmail,
} from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import MailComposer from 'nodemailer/lib/mail-composer';
import mime from 'mime-types';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import { requestApprovalInMailActionOutputSchema } from '../output-schemas';

export const requestApprovalInEmail = createAction({
  auth: gmailAuth,
  name: 'request_approval_in_mail',
  classification: 'WRITE',
  displayName: 'Request Approval in Email',
  description:
    'Send an email with an approval link and pause until it is answered.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an email, optionally with file attachments, carrying a single link to a confirmation page where the recipient chooses Approve or Disapprove, then pauses the flow until they respond, resuming with their decision. Use this as a human-in-the-loop gate before proceeding with a sensitive action. The flow blocks indefinitely until a response arrives. Not idempotent: each call sends a new approval email and creates a new wait.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'recipients',
      display: 'tabs',
      label: 'Recipients',
      description:
        'Press Enter after each address. Reply To receives replies instead of the sender.',
      props: ['receiver', 'cc', 'bcc', 'reply_to'],
    },
  ],
  props: {
    receiver: Property.ShortText({
      displayName: 'To',
      description: 'Address that receives the approval request.',
      placeholder: 'manager@example.com',
      required: true,
    }),

    cc: Property.Array({
      displayName: 'Cc',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'Bcc',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      placeholder: 'Approval needed: purchase order 1042',
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      description: 'How the text in Body is interpreted.',
      required: true,
      defaultValue: 'plain_text',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Plain Text',
            value: 'plain_text',
            description: 'Sent as written',
            icon: 'text',
          },
          {
            label: 'Rich Text',
            value: 'html',
            description: 'Bold, links, lists',
            icon: 'type',
          },
          {
            label: 'HTML Code',
            value: 'html_code',
            description: 'Paste your own markup',
            icon: 'code',
          },
        ],
      },
    }),
    body: Property.RichText({
      displayName: 'Body',
      description: 'Text shown above the Review & Respond button.',
      required: true,
      formatProperty: 'body_type',
    }),
    reply_to: Property.Array({
      displayName: 'Reply To',
      description: 'Replies go to these addresses instead of the sender.',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name shown in the inbox instead of your address.',
      placeholder: 'Jane at Acme',
      required: false,
      advanced: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'A send-as address already set up in your Gmail settings.',
      placeholder: 'sales@example.com',
      required: false,
      advanced: true,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Attachment Name',
          description: 'Overrides the uploaded file name.',
          placeholder: 'report.pdf',
          required: false,
        }),
      },
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In Reply To',
      description: 'Message-ID header of the email to thread this under.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: requestApprovalInMailActionOutputSchema,
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      try {
        const token = await getAccessToken(context.auth);

        const { subject, body } = context.propsValue;

        assertNotNullOrUndefined(token, 'token');
        assertNotNullOrUndefined(context.propsValue.receiver, 'receiver');
        assertNotNullOrUndefined(subject, 'subject');
        assertNotNullOrUndefined(body, 'body');

        const waitpoint = await context.run.createWaitpoint({
          type: 'WEBHOOK',
        });

        const confirmationLink = `${waitpoint.resumeUrl}/confirm`;

        const bodyHtml =
          context.propsValue.body_type === 'plain_text'
            ? escapeHtml(body).replace(/\r?\n/g, '<br>')
            : body;

        const htmlBody = `
        <div>
          <div>${bodyHtml}</div>
          <br />
          <p>
            <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; background-color: #6e41e2; color: white; text-decoration: none; border-radius: 4px;">Review &amp; Respond</a>
          </p>
        </div>
      `;

        const authClient = await createGoogleClient(context.auth);

        const gmail = googleGmail({ version: 'v1', auth: authClient });

        const subjectBase64 = Buffer.from(
          context.propsValue['subject']
        ).toString('base64');

        const attachments = context.propsValue.attachments as
          | { file: ApFile; name: string | undefined }[]
          | undefined;
        const replyTo = context.propsValue['reply_to']?.filter(
          (email) => email !== ''
        );
        const receiverEmail = context.propsValue.receiver;
        const cc = context.propsValue['cc']?.filter((email) => email !== '');
        const bcc = context.propsValue['bcc']?.filter((email) => email !== '');
        const mailOptions: Mail.Options = {
          to: receiverEmail,
          cc: cc ? cc.join(', ') : undefined,
          bcc: bcc ? bcc.join(', ') : undefined,
          subject: `=?UTF-8?B?${subjectBase64}?=`,
          replyTo: replyTo ? replyTo.join(', ') : '',
          html: htmlBody,
          attachments: [],
        };

        if (attachments && attachments.length > 0) {
          const attachmentOption: Attachment[] = attachments.map(
            ({ file, name }) => {
              const lookupResult = mime.lookup(
                file.extension ? file.extension : ''
              );
              return {
                filename: name ?? file.filename,
                content: file?.base64,
                contentType: lookupResult ? lookupResult : undefined,
                encoding: 'base64',
              };
            }
          );

          mailOptions.attachments = attachmentOption;
        }

        const senderEmail =
          context.propsValue.from ||
          (await getUserEmail(context.auth, authClient));
        if (senderEmail) {
          mailOptions.from = context.propsValue.sender_name
            ? `${context.propsValue['sender_name']} <${senderEmail}>`
            : senderEmail;
        }
        let threadId = undefined;
        if (context.propsValue.in_reply_to) {
          mailOptions.headers = [
            {
              key: 'References',
              value: context.propsValue.in_reply_to,
            },
            {
              key: 'In-Reply-To',
              value: context.propsValue.in_reply_to,
            },
          ];
          const messages = await gmail.users.messages.list({
            userId: 'me',
            q: `Rfc822msgid:${context.propsValue.in_reply_to}`,
          });
          threadId = messages.data.messages?.[0]?.threadId;
        }
        const mail: any = new MailComposer(mailOptions).compile();
        mail.keepBcc = true;
        const mailBody = await mail.build();

        const encodedPayload = Buffer.from(mailBody)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            threadId,
            raw: encodedPayload,
          },
        });
        context.run.waitForWaitpoint(waitpoint.id);

        return {
          approved: false, // default approval is false
        };
      } catch (error) {
        console.error(
          '[RequestApprovalEmail] Error during BEGIN execution:',
          error
        );
        throw error;
      }
    } else {
      const action = context.resumePayload.queryParams['action'];
      const approved = action === 'approve';

      return {
        approved,
      };
    }
  },
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
