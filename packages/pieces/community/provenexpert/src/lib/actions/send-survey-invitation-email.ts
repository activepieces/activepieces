import { createAction, Property } from '@activepieces/pieces-framework';
import { provenExpertAuth } from '../common/auth';
import { provenExpertCommon } from '../common';

export const sendSurveyInvitationEmailAction = createAction({
  auth: provenExpertAuth,
  name: 'send_survey_invitation_email',
  displayName: 'Send Survey Invitation Email',
  description: 'Sends a survey invitation email through ProvenExpert to a single recipient. A 7-day reminder is sent automatically unless disabled.',
  audience: 'both',
  aiMetadata: { description: 'Sends a survey invitation email to one recipient via ProvenExpert, optionally with a custom subject, salutation, and body, and an optional automatic 7-day reminder. Choose this over Create Survey Invitation URL when ProvenExpert should deliver the email itself. Requires a valid survey code and recipient email. Not idempotent: each call dispatches a new email.', idempotent: false },
  props: {
    survey_code: provenExpertCommon.surveyDropdown,
    email: Property.ShortText({
      displayName: 'Recipient Email',
      description: 'Email address that should receive the invitation.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Recipient Name',
      description: 'Optional full name of the recipient — used to address them in the email.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Optional custom subject line for the invitation. Leave empty to use the survey default.',
      required: false,
    }),
    salutation: Property.ShortText({
      displayName: 'Email Salutation',
      description: 'Optional custom greeting line (e.g. "Hi Jane,"). Leave empty to use the survey default.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Email Body',
      description: 'Optional custom message body. Leave empty to use the survey default body.',
      required: false,
    }),
    send_reminder: Property.Checkbox({
      displayName: 'Send 7-day Reminder',
      description: 'When enabled, ProvenExpert sends a reminder email after 7 days if the recipient has not responded.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      survey_code,
      email,
      name,
      subject,
      salutation,
      text,
      send_reminder,
    } = context.propsValue;

    const recipient: Record<string, unknown> = { email };
    if (name) recipient['name'] = name;
    if (subject) recipient['subject'] = subject;
    if (salutation) recipient['salutation'] = salutation;
    if (text) recipient['text'] = text;

    const response = await provenExpertCommon.apiCall<{
      status: string;
      mailing?: {
        status: string;
        id: string;
        count: { all: number; created: number; error: number };
        list?: { created?: string[]; error?: string[] };
      };
    }>({
      auth: context.auth.props,
      path: '/invite/mail/create',
      body: {
        code: survey_code,
        reminder: send_reminder === false ? 0 : 1,
        recipients: [recipient],
      },
    });

    const mailing = response.body.mailing;
    return {
      status: response.body.status,
      mailing_id: mailing?.id ?? null,
      mailing_status: mailing?.status ?? null,
      total_recipients: mailing?.count?.all ?? null,
      created_count: mailing?.count?.created ?? null,
      error_count: mailing?.count?.error ?? null,
      created_emails: Array.isArray(mailing?.list?.created)
        ? mailing!.list!.created!.join(', ')
        : null,
      error_emails: Array.isArray(mailing?.list?.error)
        ? mailing!.list!.error!.join(', ')
        : null,
      survey_code,
      recipient_email: email,
    };
  },
});
