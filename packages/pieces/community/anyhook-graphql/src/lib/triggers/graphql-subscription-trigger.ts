import { TriggerStrategy, createTrigger, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createGraphQLSubscription, deleteGraphQLSubscription } from './helpers';
import { graphqlCommon } from '../common/common';

export const graphqlSubscriptionTrigger = createTrigger({
  auth: graphqlCommon.auth,
  name: 'graphql_subscription_trigger',
  displayName: 'New GraphQL Subscription Event',
  description: 'Triggers on a new GraphQL subscription event',
  type: TriggerStrategy.WEBHOOK,
  props: {
    websocketUrl: Property.ShortText({
      displayName: 'Endpoint URL',
      description: 'The GraphQL websocket to connect to.',
      required: true,
      defaultValue: 'wss://streaming.bitquery.io/graphql?token=xxxx',
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Custom headers for the GraphQL connection, such as authentication tokens.',
      required: false,
    }),
    query: Property.LongText({
      displayName: 'GraphQL Query',
      description: 'GraphQL subscription query to listen to events',
      required: true,
      defaultValue: 'subscription { EVM(network: eth, trigger_on: head) { Blocks { Block { BaseFee BaseFeeInUSD Bloom Coinbase } } } }',
    }),
  },
  async onEnable(context) {
    const subscriptionInfo = await createGraphQLSubscription(
      context.propsValue.websocketUrl,
      context.propsValue.headers,
      context.propsValue.query,
      context.webhookUrl,
      context.auth.proxyBaseUrl
    );

    // Store subscription info
    await context.store.put('graphql_subscription_trigger', subscriptionInfo.subscriptionId);
  },
  async onDisable(context) {
    const subscriptionId: string = (await context.store.get('graphql_subscription_trigger')) as string;
    if (subscriptionId) {
      await deleteGraphQLSubscription(subscriptionId, context.auth.proxyBaseUrl);
      await context.store.delete('graphql_subscription_trigger');
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    return [
      {
        event: 'GraphQL event data',
        details: 'Details of the event',
      },
    ];
  },
  sampleData: {},
});
