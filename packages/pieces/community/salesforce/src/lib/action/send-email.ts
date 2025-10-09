import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const sendEmail = createAction({
  auth: salesforceAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Sends an email from Salesforce',
  props: {
    targetObjectIds: Property.Array({
      displayName: 'Target Object IDs',
      description: 'Array of Contact, Lead, or User IDs to send email to',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    plainTextBody: Property.LongText({
      displayName: 'Plain Text Body',
      description: 'Plain text email body',
      required: false,
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      description: 'HTML email body',
      required: false,
    }),
    whatIds: Property.Array({
      displayName: 'What IDs',
      description: 'Array of related record IDs (Account, Opportunity, etc.)',
      required: false,
    }),
    senderDisplayName: Property.ShortText({
      displayName: 'Sender Display Name',
      description: 'Display name for the email sender',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address',
      required: false,
    }),
    saveAsActivity: Property.Checkbox({
      displayName: 'Save as Activity',
      description: 'Save email as an activity in Salesforce',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      targetObjectIds,
      subject,
      plainTextBody,
      htmlBody,
      whatIds,
      senderDisplayName,
      replyTo,
      saveAsActivity,
    } = context.propsValue;

    const emailMessage: Record<string, unknown> = {
      targetObjectIds: targetObjectIds,
      subject: subject,
      ...(plainTextBody && { plainTextBody: plainTextBody }),
      ...(htmlBody && { htmlBody: htmlBody }),
      ...(whatIds && { whatIds: whatIds }),
      ...(senderDisplayName && { senderDisplayName: senderDisplayName }),
      ...(replyTo && { replyTo: replyTo }),
      ...(saveAsActivity !== undefined && { saveAsActivity: saveAsActivity }),
    };

    const requestBody = {
      messages: [emailMessage],
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/actions/standard/emailSimple',
      requestBody
    );

    return response.body;
  },
});

