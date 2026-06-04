import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { EmailSendResultSchema } from '../common/types';
import { createServiceNowClient, servicenowAuth } from '../common/props';

const RecipientsSchema = z.array(z.string().email()).min(1);
const OptionalRecipientsSchema = z.array(z.string().email()).optional();
const FromSchema = z.string().email().optional();

export const sendEmailAction = createAction({
  auth: servicenowAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description:
    'Send an email through your ServiceNow instance using the Email API. Requires the email outbound capability to be configured.',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'One or more recipient email addresses',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body. HTML is supported by ServiceNow.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Optional sender address. Defaults to the instance email-from setting.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Optional CC recipients',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Optional BCC recipients',
      required: false,
    }),
  },
  async run(context) {
    const { to, subject, body, from, cc, bcc } = context.propsValue;

    const client = createServiceNowClient(context.auth);
    const result = await client.sendEmail({
      to: RecipientsSchema.parse(to),
      subject,
      body,
      from: FromSchema.parse(from),
      cc: OptionalRecipientsSchema.parse(cc),
      bcc: OptionalRecipientsSchema.parse(bcc),
    });

    return EmailSendResultSchema.parse(result);
  },
});
