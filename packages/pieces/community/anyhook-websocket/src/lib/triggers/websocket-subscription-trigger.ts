import { TriggerStrategy, createTrigger, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createWebsocketSubscription, deleteWebsocketSubscription } from './helpers';
import { websocketCommon } from '../common/common';

export const websocketSubscriptionTrigger = createTrigger({
  auth: websocketCommon.auth,
  name: 'websocket_subscription_trigger',
  displayName: 'New Websocket Subscription Event',
  description: 'Triggers on a new Websocket subscription event',
  type: TriggerStrategy.WEBHOOK,
  props: {
    websocketUrl: Property.ShortText({
      displayName: 'Endpoint URL',
      description: 'Websocket endpoint URL to connect to.',
      required: true,
      defaultValue: 'wss://testnets-stream.openseabeta.com/socket/websocket?token=xxxx',
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Custom headers for the Websocket connection, such as authentication tokens.',
      required: false
    }),
    message: Property.Json({
      displayName: 'Subscription Message',
      description: 'The message to send to the Websocket server to subscribe to events.',
      required: true,
      defaultValue: {
        "topic": "collection:boredapeyachtclub",
        "event": "phx_join",
        "payload": {},
        "ref": 0
      }
    }),
  },
  async onEnable(context) {
    const subscriptionInfo = await createWebsocketSubscription(
      context.propsValue.websocketUrl,
      context.propsValue.headers,
      context.propsValue.message,
      context.webhookUrl,
      context.auth.proxyBaseUrl
    );

    // Store subscription info
    await context.store.put('websocket_subscription_trigger', subscriptionInfo.subscriptionId);
  },
  async onDisable(context) {
    const subscriptionId: string = (await context.store.get('websocket_subscription_trigger')) as string;
    if (subscriptionId) {
      await deleteWebsocketSubscription(subscriptionId, context.auth.proxyBaseUrl);
      await context.store.delete('websocket_subscription_trigger');
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    return [
      {
        event: 'Websocket event data',
        details: 'Details of the event',
      },
    ];
  },
  sampleData: {},
});
