import { createAction, isNil } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { collectPages, createSnsClient, SNS_LIST_CAP } from '../common/client';
import { topicDropdown } from '../common/props';

function subscriptionStatus({
  arn,
}: {
  arn: string | undefined;
}): 'confirmed' | 'pending_confirmation' | 'deleted' {
  if (!isNil(arn) && arn.startsWith('arn:')) {
    return 'confirmed';
  }
  if (arn === 'PendingConfirmation') {
    return 'pending_confirmation';
  }
  return 'deleted';
}

function mapSubscription({
  subscription,
}: {
  subscription: {
    SubscriptionArn?: string;
    TopicArn?: string;
    Protocol?: string;
    Endpoint?: string;
    Owner?: string;
  };
}) {
  const status = subscriptionStatus({ arn: subscription.SubscriptionArn });
  return {
    subscription_arn: status === 'confirmed' ? subscription.SubscriptionArn ?? null : null,
    status,
    topic_arn: subscription.TopicArn ?? null,
    protocol: subscription.Protocol ?? null,
    endpoint: subscription.Endpoint ?? null,
    owner: subscription.Owner ?? null,
    pending_confirmation: status === 'pending_confirmation',
  };
}

export const listSubscriptionsAction = createAction({
  auth: amazonSnsAuth,
  name: 'list_subscriptions',
  classification: 'SEARCH',
  displayName: 'List Subscriptions',
  description: 'Lists subscriptions for one topic, or for all topics in the region (up to 1000).',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists SNS subscriptions, either for one topic (pass its ARN) or for every topic in the region. Each item has the subscription ARN, topic ARN, protocol, endpoint, owner and a status: confirmed, pending_confirmation (waiting for the endpoint to confirm; cannot be unsubscribed) or deleted (being removed). Only confirmed items have a subscription ARN; the others have null. Returns up to 1000 and fails rather than returning a partial list if there are more. Read-only.',
    idempotent: true,
  },
  props: {
    topic_arn: topicDropdown({
      displayName: 'Topic',
      description: 'Optional. Only list subscriptions of this topic; leave empty for all topics.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'subscriptions',
        label: 'Subscriptions',
        labelKey: 'endpoint',
        listItems: [
          { key: 'subscription_arn', label: 'Subscription ARN', description: 'Null unless status is confirmed.' },
          { key: 'status', label: 'Status', description: 'confirmed, pending_confirmation or deleted.' },
          { key: 'topic_arn', label: 'Topic ARN' },
          { key: 'protocol', label: 'Protocol' },
          { key: 'endpoint', label: 'Endpoint' },
          { key: 'owner', label: 'Owner Account ID' },
          { key: 'pending_confirmation', label: 'Pending Confirmation', format: 'boolean' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  async run(context) {
    const rawTopic = context.propsValue.topic_arn?.trim();
    const topicArn = isNil(rawTopic) || rawTopic === '' ? undefined : rawTopic;
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const { items } = await collectPages({
      operation: 'list subscriptions',
      noun: 'subscriptions',
      cap: SNS_LIST_CAP,
      onCap: 'throw',
      fetchPage: async (nextToken) => {
        const page = topicArn
          ? await client.send(
              new sdk.ListSubscriptionsByTopicCommand({ TopicArn: topicArn, NextToken: nextToken })
            )
          : await client.send(new sdk.ListSubscriptionsCommand({ NextToken: nextToken }));
        return { items: page.Subscriptions ?? [], nextToken: page.NextToken };
      },
    });
    const subscriptions = items.map((subscription) => mapSubscription({ subscription }));
    return { subscriptions, count: subscriptions.length };
  },
});

export { mapSubscription, subscriptionStatus };
