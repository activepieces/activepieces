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
  volubileCommon,
} from '../common';
import { volubileAuth } from '../auth';

const markdown = `
If you wish to return a context for the triggered call, ensure the last step on the flow is a **Return Context** action.
`;

export const preCallTrigger = createTrigger({
  name: 'preCallTrigger',
  displayName: 'Pre Call Trigger',
  description: 'Pre call trigger',
  props: {
    agentId: agentsDropdown,
    about: Property.MarkDown({
      value: markdown,
    }),
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
          TriggerType.PRE_CALL
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
        name: context.webhookUrl.split('/').pop(),
        trigger: TriggerType.PRE_CALL,
        context: await context.store.get('context'),
        status: status ?? ActionStatus.DISABLED
      } as PreWebhookActionConfig
    );
  },
  async onDisable(context) {
    const response = await volubileCommon.unsubscribeWebhook(context.auth, {
      url: context.webhookUrl + "/sync",
      trigger: TriggerType.PRE_CALL,
      context: await context.store.get('context'),
    } as PreWebhookActionConfig);
    await context.store.put<ActionStatus>(
      `_prev_status`, response.body
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
