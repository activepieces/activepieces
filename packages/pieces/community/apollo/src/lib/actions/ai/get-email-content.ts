import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiGetEmailContentAction = createAction({
  auth: apolloAuth,
  name: 'ai_get_email_content',
  classification: 'READ',
  displayName: 'Get Email Content',
  description: 'Get the subject, body and recipients of outreach emails that were already sent.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the subject, body (plain text by default, or HTML) and recipients of up to 10 outreach emails Apollo has already sent, by email ID from Search Outreach Emails. Drafts are never returned, and neither are scheduled, failed or inbound emails; an ID that is not a sent email is simply missing from the list, and the list is empty when none are sent. Uses no credits.',
    idempotent: true,
  },
  props: {
    email_ids: aiProps.textList({ displayName: 'Email IDs', description: 'Up to 10 email IDs from Search Outreach Emails (field id).', required: true }),
    body_format: aiProps.choice({
      displayName: 'Body Format',
      description: 'plain (default) or html.',
      required: false,
      options: [
        { label: 'Plain text', value: 'plain' },
        { label: 'HTML', value: 'html' },
      ],
    }),
  },
  outputSchema: apolloOutputSchemas.emailContent,
  async run({ propsValue, auth }) {
    const body = await apolloRequests.getEmailContent({
      apiKey: apiKeyOf(auth),
      ids: apolloInputs.requireStringList({ value: propsValue.email_ids, label: 'Email IDs', max: 10 }),
      bodyFormat: apolloInputs.optionalText(propsValue.body_format) ?? 'plain',
    });
    return { emails: recordsOf(body['emailer_messages']).map((email) => apolloMappers.emailContent(email)) };
  },
});
