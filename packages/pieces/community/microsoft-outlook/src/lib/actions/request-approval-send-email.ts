import { createAction, Property } from '@activepieces/pieces-framework';
import { BodyType } from '@microsoft/microsoft-graph-types';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';

export const requestApprovalInMail = createAction({
  auth: microsoftOutlookAuth,
  name: 'request_approval_in_mail',
  displayName: 'Request Approval in Email',
  description:
    'Send approval request email and then wait until the email is approved or disapproved',
  audience: 'both',
  aiMetadata: { description: 'Sends an email containing Approve/Disapprove links to one recipient, then pauses the flow until they click one of the links, resuming with the decision. Use this as a human-in-the-loop approval gate before proceeding. Not idempotent: each call sends a new email and creates a new pending waitpoint.', idempotent: false },
  props: {
    recipients: Property.ShortText({
      displayName: 'To Email Address',
      description:
        'The email address of the recipient who will receive the approval request.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the approval request email.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description:
        'The main content of the email. You can include details about the approval request here in the html format or plain text.',
      required: true,
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.BEGIN) {
      try {
        const token = context.auth.access_token;

        const recipients = context.propsValue.recipients as string;
        const { subject, body } = context.propsValue;

        assertNotNullOrUndefined(token, 'token');
        assertNotNullOrUndefined(recipients, 'recipients');
        assertNotNullOrUndefined(subject, 'subject');
        assertNotNullOrUndefined(body, 'body');

        const waitpoint = await context.run.createWaitpoint({
          type: 'WEBHOOK',
        });
        const approvalLink = waitpoint.buildResumeUrl({
          queryParams: { action: 'approve' },
        });
        const disapprovalLink = waitpoint.buildResumeUrl({
          queryParams: { action: 'disapprove' },
        });

        const htmlBody = `
        <div>
          <p>${body}</p>
          <br />
          <p>
            <a href="${approvalLink}" style="display: inline-block; padding: 10px 20px; margin-right: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Approve</a>
            <a href="${disapprovalLink}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Disapprove</a>
          </p>
        </div>
      `;

        const client = outlookCommon.createClient(context.auth);

        const mailPayload = {
          subject,
          body: {
            content: htmlBody,
            contentType: 'html' as BodyType,
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipients,
              },
            },
          ],
        };

        const sendResult = await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/sendMail`).post({
          message: mailPayload,
          saveToSentItems: true,
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
