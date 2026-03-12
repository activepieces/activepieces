import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const alertForQuery = createTrigger({
  auth: asknewsAuth,
  name: 'alertForQuery',
  displayName: 'Alert for Query',
  description: 'Trigger when a new alert is created for a specific news query',
  props: {
    query: Property.LongText({
      displayName: 'Alert Query',
      description:
        'Query to monitor (e.g., "I want to be alerted if there is a protest in paris")',
      required: true,
    }),
    cron: Property.ShortText({
      displayName: 'Cron Schedule',
      description:
        'Cron schedule for alert checks (5-7 fields, e.g., "0 * * * *" for every hour, or "0 0 * * * America/New_York")',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model to use for alert checking',
      defaultValue: 'gpt-4o-mini',
      required: false,
      options: {
        options: [
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          {
            label: 'Llama 3.1 8B',
            value: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
          },
        ],
      },
    }),
    alwaysTrigger: Property.Checkbox({
      displayName: 'Always Trigger',
      description: 'Skip alert check and trigger immediately on schedule',
      defaultValue: false,
      required: false,
    }),
    repeat: Property.Checkbox({
      displayName: 'Repeat',
      description:
        'Repeat alert after each trigger (disable for one-time alert)',
      defaultValue: true,
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Alert Title',
      description: 'Optional title for the alert',
      required: false,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { auth, propsValue, webhookUrl } = context;
    const params = propsValue;
    const alertRequestBody = {
      query: params.query,
      cron: params.cron,
      model: params.model,
      title: params.title,
      always_trigger: params.alwaysTrigger,
      repeat: params.repeat,
      sources: [
        {
          identifier: 'asknews',
        },
      ],
      triggers: [
        {
          action: 'webhook',
          params: {
            url: webhookUrl,
            headers: {},
            payload: {},
          },
        },
      ],
      active: true,
    };
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/chat/alerts',
      alertRequestBody
    );
    await context.store?.put(`asknews_alert_id_${webhookUrl}`, response.id);
  },
  async onDisable(context) {
    const { auth, webhookUrl } = context;
    const alertId = await context.store?.get(`asknews_alert_id_${webhookUrl}`);
    if (alertId) {
      await makeRequest(
        auth.secret_text,
        HttpMethod.DELETE,
        `/chat/alerts/${alertId}`,
        {}
      );
      await context.store.delete(`asknews_alert_id_${webhookUrl}`);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
