import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../..';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail from 'nodemailer/lib/mailer';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';

export const requestApprovalInEmail = createAction({
  auth: gmailAuth,
  name: 'request_approval_in_mail',
  displayName: 'Request Approval in Email',
  description:
    'Send approval request email and then wait until the email is approved or disapproved',
  props: {
    receiver: Property.ShortText({
      displayName: 'Receiver Email (To)',
      description:
        'The email address of the recipient who will receive the approval request.',
      required: true,
    }),

    cc: Property.Array({
      displayName: 'CC Email',
      description:
        'The email addresses of the recipients who will receive a carbon copy of the approval request.',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC Email',
      description:
        'The email addresses of the recipients who will receive a blind carbon copy of the approval request.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the approval request email.',
      required: true,
    }),
    body: Property.ShortText({
      displayName: 'Body',
      description: 'Body for the email you want to send',
      required: true,
    }),
    reply_to: Property.Array({
      displayName: 'Reply-To Email',
      description: 'Email address to set as the "Reply-To" header',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email',
      description:
        "The address must be listed in your GMail account's settings",
      required: false,
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In reply to',
      description: 'Reply to this Message-ID',
      required: false,
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      try {
        const token = context.auth.access_token;

        const { subject, body } = context.propsValue;

        assertNotNullOrUndefined(token, 'token');
        assertNotNullOrUndefined(context.propsValue.receiver, 'receiver');
        assertNotNullOrUndefined(subject, 'subject');
        assertNotNullOrUndefined(body, 'body');

        const approvalLink = context.generateResumeUrl({
          queryParams: { action: 'approve' },
        });
        const disapprovalLink = context.generateResumeUrl({
          queryParams: { action: 'disapprove' },
        });

        const htmlBody = `
        <div>
          <p>${body}</p>
          <br />
          <p>
            <a href="${approvalLink}" style="display: inline-block; padding: 10px 20px; margin-right: 10px; background-color: #2acc50; color: white; text-decoration: none; border-radius: 4px;">Approve</a>
            <a href="${disapprovalLink}" style="display: inline-block; padding: 10px 20px; background-color: #e4172b; color: white; text-decoration: none; border-radius: 4px;">Disapprove</a>
          </p>
        </div>
      `;

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const subjectBase64 = Buffer.from(
          context.propsValue['subject']
        ).toString('base64');

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
          // text:
          //   context.propsValue.body_type === 'plain_text'
          //     ? context.propsValue['body']
          //     : undefined,
          html: htmlBody,
          attachments: [],
        };

        const senderEmail =
          context.propsValue.from ||
          (
            await google
              .oauth2({ version: 'v2', auth: authClient })
              .userinfo.get()
          ).data.email;
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
          threadId = messages.data.messages?.[0].threadId;
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
        context.run.pause({
          pauseMetadata: {
            type: PauseType.WEBHOOK,
            response: {},
          },
        });

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
