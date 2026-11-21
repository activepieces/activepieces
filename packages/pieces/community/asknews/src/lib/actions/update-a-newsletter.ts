import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateANewsletter = createAction({
  auth: asknewsAuth,
  name: 'updateANewsletter',
  classification: 'WRITE',
  displayName: 'Update Newsletter',
  description: 'Change the settings of an existing newsletter.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing AskNews newsletter identified by its UUID, applying only the fields you supply (query, schedule, model, sender, active/public flags, etc.) and leaving the rest unchanged. Choose this to edit or activate/deactivate a newsletter you already created. Requires the newsletter UUID. Repeating the same update yields the same end state.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'newsletter',
      display: 'section',
      label: 'Newsletter to Update',
      icon: 'file',
      props: ['newsletterId'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changesInfo', 'name', 'query', 'model', 'isPublic', 'isActive'],
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
      props: ['resendApiKey', 'audienceId'],
    },
  ],
  props: {
    newsletterId: Property.ShortText({
      displayName: 'Newsletter ID',
      description: 'ID returned when the newsletter was created.',
      placeholder: '123e4567-e89b-12d3-a456-426614174000',
      required: true,
    }),
    changesInfo: Property.MarkDown({
      value:
        'Empty fields keep their current value. Public and Active are always sent: leave them off and the newsletter turns private and paused.',
      variant: MarkdownVariant.WARNING,
    }),
    name: Property.ShortText({
      displayName: 'Newsletter Name',
      placeholder: 'Morning AI Brief',
      required: false,
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'What each issue should cover, in plain words.',
      placeholder: 'Top AI research news of the day',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model that writes each issue.',
      required: false,
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
      description: 'Off makes the newsletter private.',
      required: false,
      width: 'half',
    }),
    isActive: Property.Checkbox({
      displayName: 'Active',
      description: 'Off pauses the newsletter.',
      required: false,
      width: 'half',
    }),
    cron: Property.ShortText({
      displayName: 'Cron Schedule',
      description: 'When to send, as a cron expression in UTC.',
      placeholder: '0 8 * * *',
      required: false,
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
      required: false,
      width: 'half',
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Where replies go.',
      placeholder: 'you@acme.com',
      required: false,
      width: 'half',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject for each issue.',
      required: false,
    }),
    logoUrl: Property.ShortText({
      displayName: 'Logo URL',
      description: 'Logo image shown in each email.',
      placeholder: 'https://yourdomain.com/logo.png',
      required: false,
    }),
    resendApiKey: Property.ShortText({
      displayName: 'Resend API Key',
      description: 'Key used to send the emails.',
      placeholder: 're_...',
      required: false,
    }),
    audienceId: Property.ShortText({
      displayName: 'Audience ID',
      description: 'Resend audience to email.',
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
