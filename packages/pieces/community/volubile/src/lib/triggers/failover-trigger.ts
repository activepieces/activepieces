import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  ActionStatus,
  agentsDropdown,
  PreWebhookActionConfig,
  TriggerType,
  volubileCommon, WebhookActionConfig
} from '../common';
import { volubileAuth } from '../auth';

export const failoverTrigger = createTrigger({
  name: 'failoverTrigger',
  displayName: 'Failover Trigger',
  description: 'Failover trigger',
  props: {
    agentId: agentsDropdown,
    sampleData: Property.Json({
      displayName: 'Test input data',
      description: 'Override the test input data',
      defaultValue: {},
      required: false,
    }),
  },
  auth: volubileAuth,
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async test(context) {
    const data = context.propsValue.sampleData;
    if (data === null || data === undefined || Object.keys(data!).length === 0) {
      return [
        await volubileCommon.getContext(
          context.auth,
          context.propsValue.agentId!,
          TriggerType.FAILOVER
        ),
      ];
    }

    return [data];
  },
  async onEnable(context) {
    const status = await context.store.get<ActionStatus>(
      `_prev_status`
    );
    await volubileCommon.subscribeWebhook(
      context.auth,
      context.propsValue.agentId!,
      {
        url: context.webhookUrl + "/sync",
        trigger: TriggerType.FAILOVER,
        name: 'Failover Webhook',
        status: status ?? ActionStatus.DISABLED
      } as WebhookActionConfig
    );
  },
  async onDisable(context) {
    const response = await volubileCommon.unsubscribeWebhook(context.auth, {
      url: context.webhookUrl + "/sync",
      trigger: TriggerType.FAILOVER,
    } as WebhookActionConfig);
    await context.store.put<ActionStatus>(
      `_prev_status`, response.body
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
