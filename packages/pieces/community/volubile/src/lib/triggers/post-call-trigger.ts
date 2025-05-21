
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { agentsDropdown, WebhookActionConfig, TriggerType, volubileCommon, ActionStatus } from '../common';
import { volubileAuth } from '../auth';
export const postCallTrigger = createTrigger({
  name: 'postCallTrigger',
  displayName: 'Post Call Trigger',
  description: 'Post call trigger',
  props: {
    agentId: agentsDropdown,
    sampleData: Property.Json({
      displayName: 'Sample data',
      description:
        'Set the test input data',
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
          TriggerType.POST_CALL
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
        url: context.webhookUrl,
        name: context.webhookUrl.split('/').pop(),
        trigger: TriggerType.POST_CALL,
        status: status
      } as WebhookActionConfig,
    );
  },
  async onDisable(context){
    const response = await volubileCommon.unsubscribeWebhook(
      context.auth,
      {
        url: context.webhookUrl,
        trigger: TriggerType.POST_CALL
      } as WebhookActionConfig,
    );
    await context.store.put<ActionStatus>(
      `_prev_status`, response.body
    );
  },
  async run(context){
    return [context.payload.body]
  }
})
