import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiGetEmailSendStatusAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_email_send_status',
  classification: 'READ',
  displayName: 'Check Email Send Status',
  description: 'Check whether an email was sent.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the current delivery status of one email message by email ID from Search Outreach Emails, with a readable message plus the sent time, or the not-sent or failure reason. Uses no credits.',
    idempotent: true,
  },
  props: {
    email_id: aiProps.id({ displayName: 'Email ID', description: 'Email ID from Search Outreach Emails (field id).' }),
  },
  outputSchema: apolloOutputSchemas.emailSendStatus,
  async run({ propsValue, auth }) {
    const body = await apolloRequests.getEmailSendStatus({ apiKey: apiKeyOf(auth), id: apolloInputs.requireText({ value: propsValue.email_id, label: 'Email ID' }) });
    return apolloMappers.emailSendStatus(body);
  },
});
