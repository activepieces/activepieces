import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { BodyType } from '@microsoft/microsoft-graph-types';
import {
  assertNotNullOrUndefined,
  ExecutionType,
  PauseType,
} from '@activepieces/shared';
import { microsoftOutlookAuth } from '../common/auth';

export const requestApprovalSendEmail = createAction({
  auth: microsoftOutlookAuth,
  name: 'requestApprovalSendEmail',
  displayName: 'Request Approval in Email',
  description:
    'Send approval request email and then wait until the email is approved or disapproved',
  props: {
    recipients: Property.ShortText({
      displayName: 'To Email(s)',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    // bodyFormat: Property.StaticDropdown({
    //   displayName: 'Body Format',
    //   required: true,
    //   defaultValue: 'html',
    //   options: {
    //     disabled: false,
    //     options: [
    //       { label: 'HTML', value: 'html' },
    //       { label: 'Text', value: 'text' },
    //     ],
    //   },
    // }),
    body: Property.LongText({
      displayName: 'Body',
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
