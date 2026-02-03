import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateANewsletter = createAction({
  auth: asknewsAuth,
  name: 'updateANewsletter',
  displayName: 'Update a Newsletter',
  description: 'Update an existing automated newsletter',
  props: {
    newsletterId: Property.ShortText({
      displayName: 'Newsletter ID',
      description: 'UUID of the newsletter to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Newsletter Name',
      description: 'Name of the newsletter',
      required: false,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'Natural language query to define newsletter content',
      required: false,
    }),
    cron: Property.ShortText({
      displayName: 'Cron Schedule',
      description:
        'Cron expression for newsletter schedule (e.g., "0 0 * * *" for daily at midnight UTC)',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model to use for newsletter generation',
      required: false,
      options: {
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
          {
            label: 'Meta Llama 3.3 70B',
            value: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
          },
        ],
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Newsletter email subject',
      required: false,
    }),
    sender: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Email address of the newsletter sender',
      required: false,
    }),
    logoUrl: Property.ShortText({
      displayName: 'Logo URL',
      description: 'URL of the newsletter logo',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Email address for replies',
      required: false,
    }),
    audienceId: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Audience ID for the newsletter',
      required: false,
    }),
    resendApiKey: Property.ShortText({
      displayName: 'Resend API Key',
      description: 'API key for Resend email service',
      required: false,
    }),
    isPublic: Property.Checkbox({
      displayName: 'Is Public',
      description: 'Make newsletter publicly discoverable',
      required: false,
    }),
    isActive: Property.Checkbox({
      displayName: 'Is Active',
      description: 'Activate or deactivate the newsletter',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expiration Date',
      description:
        'Newsletter expiration date (ISO format: YYYY-MM-DDTHH:MM:SS)',
      required: false,
    }),
  },
  async run(context) {
    const {
      newsletterId,
      name,
      query,
      cron,
      model,
      subject,
      sender,
      logoUrl,
      replyTo,
      audienceId,
      resendApiKey,
      isPublic,
      isActive,
      expiresAt,
    } = context.propsValue;

    const requestBody: any = {};

    if (name !== undefined && name !== '') requestBody.name = name;
    if (query !== undefined && query !== '') requestBody.query = query;
    if (cron !== undefined && cron !== '') requestBody.cron = cron;
    if (model !== undefined && model !== '') requestBody.model = model;
    if (subject !== undefined && subject !== '') requestBody.subject = subject;
    if (sender !== undefined && sender !== '') requestBody.sender = sender;
    if (logoUrl !== undefined && logoUrl !== '') requestBody.logo_url = logoUrl;
    if (replyTo !== undefined && replyTo !== '') requestBody.reply_to = replyTo;
    if (audienceId !== undefined && audienceId !== '')
      requestBody.audience_id = audienceId;
    if (resendApiKey !== undefined && resendApiKey !== '')
      requestBody.resend_api_key = resendApiKey;
    if (isPublic !== undefined) requestBody.public = isPublic;
    if (isActive !== undefined) requestBody.active = isActive;
    if (expiresAt !== undefined && expiresAt !== '')
      requestBody.expires_at = expiresAt;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.PUT,
      `/chat/newsletters/${newsletterId}`,
      requestBody
    );

    return response;
  },
});
