import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { volubileAuth } from '../auth';
import { ActionStatus, agentsDropdown, LiveWebhookActionConfig, TriggerType, volubileCommon } from '../common';


export const liveCallTrigger = createTrigger({
  name: 'liveCallTrigger',
  displayName: 'Live Call Trigger',
  description: 'Live call trigger',
  type: TriggerStrategy.WEBHOOK,
  auth: volubileAuth,
  sampleData: null,
  props: {
    agentId: agentsDropdown,
    name: Property.ShortText({
      displayName: 'Action Name',
      description: 'Name of the action',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Action Description',
      description: 'Description of the action, it should explain when and why the agent should call this action',
      required: true,
    }),
    schemaProperties: Property.Array({
      displayName: 'Dynamic properties',
      description: 'Define the properties expected in the webhook payload that the Agent will infer based on the conversation',
      required: false,
      defaultValue: [],
      properties: {
        name: Property.ShortText({
          displayName: 'Property Name',
          description: 'Name of the property in the webhook payload',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of what this property represents',
          required: false,
        }),
        required: Property.Checkbox({
          displayName: 'Required',
          description: 'Is this property required in the payload?',
          required: true,
          defaultValue: false,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'Data type of this property',
          required: true,
          defaultValue: 'string',
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Integer', value: 'integer' },
              { label: 'Boolean', value: 'boolean' }
            ]
          }
        }),
      }
    }),
    sampleData: Property.Json({
      displayName: 'Sample data',
      description: 'Set the test input data',
      defaultValue: {},
      required: false,
    }),
    inputSchema: Property.Json({
      displayName: 'Action input schema',
      required: false,
    }),
  },
  async test(context) {
    const data = context.propsValue.sampleData;
    if (data === null || data === undefined || Object.keys(data!).length === 0) {
      return [
        await volubileCommon.getContext(
          context.auth,
          context.propsValue.agentId!,
          TriggerType.LIVE_CALL
        ),
      ];
    }

    return [data];
  },
  async onEnable(context) {
    const schema = context.propsValue.inputSchema ?? buildJsonSchema(context.propsValue.schemaProperties!);
    const status = await context.store.get<ActionStatus>(
      `_prev_status`
    );
    await volubileCommon.subscribeWebhook(
      context.auth,
      context.propsValue.agentId!,
      {
        url: context.webhookUrl + '/sync',
        trigger: TriggerType.LIVE_CALL,
        name: context.propsValue.name,
        description: context.propsValue.description,
        schema: schema,
        status: status,
      } as LiveWebhookActionConfig,
    );
  },

  async onDisable(context) {
    const response = await volubileCommon.unsubscribeWebhook(
      context.auth,
      {
        url: context.webhookUrl + '/sync',
        trigger: TriggerType.LIVE_CALL,
        name: context.propsValue.name,
        description: context.propsValue.description
      } as LiveWebhookActionConfig,
    );

    await context.store.put<ActionStatus>(
      `_prev_status`, response.body
    );
  },

  async run(context) {
    return [context.payload.body]
  },
});

function buildJsonSchema(properties: Array<any>) {
  const schemaProperties: Record<string, any> = {};
  const required: string[] = [];

  for (const prop of properties) {
    schemaProperties[prop.name] = {
      type: prop.type,
      description: prop.description || undefined
    };

    if (prop.required) {
      required.push(prop.name);
    }
  }

  return {
    type: 'object',
    properties: schemaProperties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false
  };
}
