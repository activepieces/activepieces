import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { Client } from '@microsoft/microsoft-graph-client';
import { BodyType } from '@microsoft/microsoft-graph-types';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';

export const requestApprovalInMail = createAction({
  auth: microsoftOutlookAuth,
  name: 'request_approval_in_mail',
  displayName: 'Request Approval in Email',
  description:
    'Send approval request email and then wait until the email is approved or disapproved',
  audience: 'both',
  aiMetadata: { description: 'Sends an email with a single link to a confirmation page where the recipient chooses Approve or Disapprove, then pauses the flow until they respond, resuming with the decision. Use this as a human-in-the-loop approval gate before proceeding. Not idempotent: each call sends a new email and creates a new pending waitpoint.', idempotent: false },
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
        const confirmationLink = `${waitpoint.resumeUrl}/confirm`;

        const htmlBody = `
        <div>
          <p>${body}</p>
          <br />
          <p>
            <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; background-color: #6e41e2; color: white; text-decoration: none; border-radius: 4px;">Review &amp; Respond</a>
          </p>
        </div>
      `;

        const cloud = context.auth.props?.['cloud'] as string | undefined;
        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(context.auth.access_token),
          },
          baseUrl: getGraphBaseUrl(cloud),
        });

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

        const sendResult = await client.api('/me/sendMail').post({
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
