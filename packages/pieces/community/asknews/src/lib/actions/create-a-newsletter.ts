import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createANewsletter = createAction({
  auth: asknewsAuth,
  name: 'createANewsletter',
  classification: 'WRITE',
  displayName: 'Create Newsletter',
  description: 'Set up a newsletter that AI writes and emails on a schedule.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new automated AskNews newsletter that recurrently generates and emails AI-written news digests on a cron schedule, defined by a natural-language query. Choose this to set up a recurring news email; requires a name, query, cron expression, model, and sender, plus a Resend API key to actually send. Not idempotent — each call creates a separate newsletter.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'newsletter',
      display: 'section',
      label: 'Newsletter',
      icon: 'file',
      props: ['name', 'query', 'model', 'isPublic', 'isActive'],
    },
    {
      key: 'schedule',
      display: 'section',
      label: 'Schedule',
      icon: 'calendar',
      props: ['cron', 'expiresAt'],
    },
    {
      key: 'email',
      display: 'section',
      label: 'Email',
      icon: 'send',
      props: ['sender', 'replyTo', 'subject', 'logoUrl'],
    },
    {
      key: 'resend',
      display: 'section',
      label: 'Resend',
      icon: 'inbox',
      props: ['resendInfo', 'resendApiKey', 'audienceId'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Newsletter Name',
      placeholder: 'Morning AI Brief',
      required: true,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'What each issue should cover, in plain words.',
      placeholder: 'Top AI research news of the day',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model that writes each issue.',
      defaultValue: 'gpt-4o',
      required: true,
      options: {
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
          {
            label: 'Meta Llama 3.1 405B',
            value: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
          },
          {
            label: 'Meta Llama 3.3 70B',
            value: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
          },
        ],
      },
    }),
    isPublic: Property.Checkbox({
      displayName: 'Public',
      description: 'Let anyone find this newsletter.',
      defaultValue: true,
      required: false,
      width: 'half',
    }),
    isActive: Property.Checkbox({
      displayName: 'Active',
      description: 'Start sending on the schedule right away.',
      defaultValue: true,
      required: false,
      width: 'half',
    }),
    cron: Property.ShortText({
      displayName: 'Cron Schedule',
      description: 'When to send, as a cron expression in UTC.',
      placeholder: '0 8 * * *',
      required: true,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expiration Date',
      description: 'Stop sending after this date and time.',
      placeholder: '2026-12-31T23:59:59',
      required: false,
    }),
    sender: Property.ShortText({
      displayName: 'Sender Email',
      placeholder: 'news@acme.com',
      required: true,
      width: 'half',
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Where replies go. Empty: the sender address.',
      placeholder: 'you@acme.com',
      required: false,
      width: 'half',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject. Empty: written by AI for each issue.',
      required: false,
    }),
    logoUrl: Property.ShortText({
      displayName: 'Logo URL',
      description: 'Logo image shown in each email.',
      placeholder: 'https://yourdomain.com/logo.png',
      required: false,
    }),
    resendInfo: Property.MarkDown({
      value: 'Newsletters are emailed through your Resend account.',
      variant: MarkdownVariant.INFO,
    }),
    resendApiKey: Property.ShortText({
      displayName: 'Resend API Key',
      description: 'Needed to send the emails.',
      placeholder: 're_...',
      required: false,
    }),
    audienceId: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Resend audience to email. Empty: a new one is created.',
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
