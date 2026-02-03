import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createANewsletter = createAction({
  auth: asknewsAuth,
  name: 'createANewsletter',
  displayName: 'Create a Newsletter',
  description: 'Create an automated newsletter powered by news and AI',
  props: {
    name: Property.ShortText({
      displayName: 'Newsletter Name',
      description: 'Name of the newsletter',
      required: true,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'Natural language query to define newsletter content',
      required: true,
    }),
    cron: Property.ShortText({
      displayName: 'Cron Schedule',
      description: 'Cron expression for newsletter schedule (e.g., "0 0 * * *" for daily at midnight UTC)',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model to use for newsletter generation',
      defaultValue: 'gpt-4o',
      required: true,
      options: {
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
          { label: 'Meta Llama 3.1 405B', value: 'meta-llama/Meta-Llama-3.1-405B-Instruct' },
          { label: 'Meta Llama 3.3 70B', value: 'meta-llama/Meta-Llama-3.3-70B-Instruct' },
        ],
      },
    }),
    sender: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Email address of the newsletter sender',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Newsletter email subject (auto-generated if not provided)',
      required: false,
    }),
    logoUrl: Property.ShortText({
      displayName: 'Logo URL',
      description: 'URL of the newsletter logo',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Email address for replies (defaults to sender if not provided)',
      required: false,
    }),
    audienceId: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Existing audience ID (creates new audience if not provided)',
      required: false,
    }),
    resendApiKey: Property.ShortText({
      displayName: 'Resend API Key',
      description: 'API key for Resend email service (required to send newsletter)',
      required: false,
    }),
    isPublic: Property.Checkbox({
      displayName: 'Is Public',
      description: 'Make newsletter publicly discoverable',
      defaultValue: true,
      required: false,
    }),
    isActive: Property.Checkbox({
      displayName: 'Is Active',
      description: 'Activate the newsletter immediately',
      defaultValue: true,
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expiration Date',
      description: 'Newsletter expiration date (ISO format: YYYY-MM-DDTHH:MM:SS)',
      required: false,
    }),
  },
  async run(context) {
    const {name, query, cron, model, sender, subject, logoUrl, replyTo, audienceId, resendApiKey, isPublic, isActive, expiresAt} = context.propsValue;

    const requestBody = {
      name: name,
      query: query,
      cron: cron,
      model: model,
      sender: sender,
      subject: subject,
      logo_url: logoUrl,
      reply_to: replyTo,
      audience_id: audienceId,
      resend_api_key: resendApiKey,
      public: isPublic,
      active: isActive,
      expires_at: expiresAt,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/chat/newsletters',
      requestBody
    );

    return response;
  },
});
