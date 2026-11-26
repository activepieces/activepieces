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
  classification: 'READ',
  displayName: 'New News Alert',
  description: 'Fires when AskNews finds news that matches your alert query.',
  aiMetadata: {
    description:
      'Fires when an AskNews alert matches a monitored natural-language news query on its cron schedule (or on every scheduled check if "Always Trigger" is enabled), delivering the matching alert payload. Represents a newly detected news development matching the query of interest.',
  },
  propertyGroups: [
    {
      key: 'alert',
      display: 'section',
      label: 'Alert',
      icon: 'text',
      props: ['query', 'title', 'model'],
    },
    {
      key: 'schedule',
      display: 'section',
      label: 'Schedule',
      icon: 'calendar',
      props: ['cron', 'repeat', 'alwaysTrigger'],
    },
  ],
  props: {
    query: Property.LongText({
      displayName: 'Alert Query',
      description: 'Describe the news to watch for, in plain words.',
      placeholder: 'Alert me if there is a protest in Paris',
      required: true,
    }),
    cron: Property.ShortText({
      displayName: 'Cron Schedule',
      description:
        'How often to check, as a cron expression. A time zone may follow.',
      placeholder: '0 * * * *',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model that checks the news for matches.',
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
      description: 'Fire on every check, even when nothing matches.',
      defaultValue: false,
      required: false,
    }),
    repeat: Property.Checkbox({
      displayName: 'Repeat',
      description: 'Keep the alert after it fires. Off: fire once.',
      defaultValue: true,
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Alert Title',
      description: 'Name for the alert in AskNews.',
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
