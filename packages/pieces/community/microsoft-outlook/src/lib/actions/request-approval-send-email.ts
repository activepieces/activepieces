import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { BodyType } from '@microsoft/microsoft-graph-types';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';
import { microsoftOutlookAuth } from '../common/auth';

export const requestApprovalInMail = createAction({
  auth: microsoftOutlookAuth,
  name: 'request_approval_in_mail',
  displayName: 'Request Approval in Email',
  description:
    'Send approval request email and then wait until the email is approved or disapproved',
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
            <a href="${approvalLink}" style="display: inline-block; padding: 10px 20px; margin-right: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Approve</a>
            <a href="${disapprovalLink}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Disapprove</a>
          </p>
        </div>
      `;

        const client = Client.initWithMiddleware({
          authProvider: {
            getAccessToken: () => Promise.resolve(context.auth.access_token),
          },
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
