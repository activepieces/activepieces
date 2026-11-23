import { createAction, isNil } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient, topicNameFromArn } from '../common/client';
import { topicDropdown } from '../common/props';

function toNumber({ value }: { value: string | undefined }): number | null {
  if (isNil(value) || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalAttribute({ value }: { value: string | undefined }): string | null {
  if (isNil(value) || value.trim() === '') {
    return null;
  }
  return value;
}

function mapTopicAttributes({
  topicArn,
  attributes,
}: {
  topicArn: string;
  attributes: Record<string, string>;
}) {
  return {
    topic_arn: optionalAttribute({ value: attributes['TopicArn'] }) ?? topicArn,
    name: topicNameFromArn({ arn: optionalAttribute({ value: attributes['TopicArn'] }) ?? topicArn }),
    display_name: optionalAttribute({ value: attributes['DisplayName'] }),
    owner: optionalAttribute({ value: attributes['Owner'] }),
    fifo: attributes['FifoTopic'] === 'true',
    content_based_deduplication: attributes['ContentBasedDeduplication'] === 'true',
    subscriptions_confirmed: toNumber({ value: attributes['SubscriptionsConfirmed'] }),
    subscriptions_pending: toNumber({ value: attributes['SubscriptionsPending'] }),
    subscriptions_deleted: toNumber({ value: attributes['SubscriptionsDeleted'] }),
    kms_master_key_id: optionalAttribute({ value: attributes['KmsMasterKeyId'] }),
    policy: optionalAttribute({ value: attributes['Policy'] }),
    effective_delivery_policy: optionalAttribute({ value: attributes['EffectiveDeliveryPolicy'] }),
  };
}

export const getTopicAction = createAction({
  auth: amazonSnsAuth,
  name: 'get_topic',
  classification: 'READ',
  displayName: 'Get Topic',
  description: 'Gets the settings and subscription counts of a topic.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one SNS topic\'s details by ARN: display name, owner account, whether it is FIFO and uses content-based deduplication, confirmed/pending/deleted subscription counts, KMS key and access policy (as a JSON string). Use it to check a topic before publishing or subscribing. Read-only.',
    idempotent: true,
  },
  props: {
    topic_arn: topicDropdown({
      displayName: 'Topic',
      description: 'The topic to read.',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'topic_arn', label: 'Topic ARN' },
      { key: 'name', label: 'Name' },
      { key: 'display_name', label: 'Display Name', description: 'Sender name used for SMS and email subscribers; null if unset.' },
      { key: 'owner', label: 'Owner Account ID' },
      { key: 'fifo', label: 'Is FIFO', format: 'boolean' },
      { key: 'content_based_deduplication', label: 'Content-Based Deduplication', format: 'boolean' },
      { key: 'subscriptions_confirmed', label: 'Confirmed Subscriptions', format: 'number' },
      { key: 'subscriptions_pending', label: 'Pending Subscriptions', format: 'number' },
      { key: 'subscriptions_deleted', label: 'Deleted Subscriptions', format: 'number' },
      { key: 'kms_master_key_id', label: 'KMS Key ID', description: 'Null when the topic is not encrypted.' },
      { key: 'policy', label: 'Access Policy (JSON)' },
      { key: 'effective_delivery_policy', label: 'Effective Delivery Policy (JSON)' },
    ],
  },
  async run(context) {
    const topicArn = context.propsValue.topic_arn.trim();
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const response = await callSns({
      operation: 'get topic',
      call: () => client.send(new sdk.GetTopicAttributesCommand({ TopicArn: topicArn })),
    });
    return mapTopicAttributes({ topicArn, attributes: response.Attributes ?? {} });
  },
});

export { mapTopicAttributes };
