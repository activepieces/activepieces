import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';

type SendEmailResult = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    messageId?: string;
    queuedAt?: string;
    accepted?: string[];
    rejected?: string[];
  };
};

export const sendTransactionalEmailAction = createAction({
  auth: useinboxAuth,
  name: 'send_transactional_email',
  displayName: 'Send Transactional Email',
  description:
    'Sends a one-off transactional email through INBOX Notify (e.g. password reset, receipt, welcome).',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a single one-off transactional HTML email to one recipient through INBOX Notify, for messages like password resets, receipts, or welcome emails. Use for direct triggered email rather than list campaigns. Requires from name, from email, recipient, subject, and HTML body; the from-email domain must already be authenticated in INBOX Notify. Optional merge-field values replace #key# placeholders in the HTML. Not idempotent: each call sends another email.',
    idempotent: false,
  },
  props: {
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'The display name shown to recipients (e.g. "Acme Support").',
      required: true,
    }),
    fromEmail: Property.ShortText({
      displayName: 'From Email',
      description:
        'Verified sender email. The domain must already be authenticated in INBOX Notify, otherwise the email will be rejected.',
      required: true,
    }),
    toEmail: Property.ShortText({
      displayName: 'To Email',
      description: 'Email address of the recipient.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line.',
      required: true,
    }),
    htmlContent: Property.LongText({
      displayName: 'HTML Content',
      description:
        'The HTML body of the email. You can reference INBOX merge fields with `#fieldName#` and provide values in Custom Fields below.',
      required: true,
    }),
    customFields: Property.Object({
      displayName: 'Merge Field Values',
      description:
        'Optional. Key-value pairs that replace `#key#` placeholders in your HTML (e.g. `{ "name": "Jane", "code": "12345" }`).',
      required: false,
    }),
  },
  async run(context) {
    const { fromName, fromEmail, toEmail, subject, htmlContent, customFields } =
      context.propsValue;

    const token = await useinboxClient.fetchAccessToken({
      email: context.auth.username,
      password: context.auth.password,
    });

    const response = await useinboxClient.inboxApiCall<SendEmailResult>({
      token,
      service: 'notify',
      method: HttpMethod.POST,
      path: '/send',
      body: {
        from: { name: fromName, email: fromEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
        ...(customFields && Object.keys(customFields).length > 0
          ? { customFields }
          : {}),
      },
    });

    const result = response.body?.resultObject ?? {};
    return {
      success: response.body?.resultStatus ?? false,
      result_code: response.body?.resultCode ?? null,
      result_message: response.body?.resultMessage ?? null,
      message_id: result.messageId ?? null,
      queued_at: result.queuedAt ?? null,
      accepted: Array.isArray(result.accepted) ? result.accepted.join(', ') : null,
      rejected: Array.isArray(result.rejected) ? result.rejected.join(', ') : null,
      to_email: toEmail,
      from_email: fromEmail,
      subject,
    };
  },
});
