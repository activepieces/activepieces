import { createAction, Property } from '@activepieces/pieces-framework';
import { mailjetAuth } from '../auth';
import { mailjetApi } from '../common/api';
import { sendEmailOutputSchema } from '../output-schemas';

export const sendEmailAction = createAction({
  auth: mailjetAuth,
  name: 'send_email',
  outputSchema: sendEmailOutputSchema,
  classification: 'WRITE',
  displayName: 'Send Email',
  description: 'Send a text, HTML or template email through Mailjet',
  audience: 'human',
  aiMetadata: { description: 'Sends an email to one or more recipients via the Mailjet transactional send API. Supply the body inline as plain text and/or HTML, or set a Mailjet template ID to render a predefined template with optional variables. Use when delivering a notification, alert, or transactional message; the sender address must be a verified Mailjet sender. Not idempotent — each call dispatches a new email.', idempotent: false },
  props: {
    fromEmail: Property.ShortText({
      displayName: 'From (Email)',
      description: 'Sender email, must be verified in Mailjet',
      required: true
    }),
    fromName: Property.ShortText({
      displayName: 'From (Name)',
      required: false
    }),
    toEmails: Property.Array({
      displayName: 'Emails of recipients',
      required: true
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
      required: true
    }),
    textPart: Property.LongText({
      displayName: 'Text part',
      description: undefined,
      required: false
    }),
    htmlPart: Property.LongText({
      displayName: 'HTML part',
      description: undefined,
      required: false
    }),
    templateId: Property.Number({
      displayName: 'Template Id',
      description: 'Template Id (number) defined in Mailjet',
      required: false
    }),
    templateVariables: Property.Object({
      displayName: 'Template variables',
      description: undefined,
      required: false
    })
  },
  async run({ propsValue, auth }) {
    return await mailjetApi.sendEmail({
      auth,
      fromEmail: propsValue.fromEmail,
      fromName: propsValue.fromName,
      toEmails: propsValue.toEmails,
      subject: propsValue.subject,
      textPart: propsValue.textPart,
      templateId: propsValue.templateId,
      templateVariables: propsValue.templateVariables,
    });
  }
});
