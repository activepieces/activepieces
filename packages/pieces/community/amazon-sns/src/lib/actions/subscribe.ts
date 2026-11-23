import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient } from '../common/client';
import { topicDropdown, yesNoOptions } from '../common/props';

const PROTOCOLS = [
  'email',
  'email-json',
  'sms',
  'http',
  'https',
  'sqs',
  'lambda',
  'firehose',
  'application',
];

const RAW_DELIVERY_PROTOCOLS = ['sqs', 'http', 'https', 'firehose'];

function validateJsonText({ label, value }: { label: string; value: string }): void {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || isNil(parsed) || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
  } catch {
    throw new Error(`${label} must be a JSON object, e.g. {"event_type": ["order_placed"]}.`);
  }
}

function buildSubscribeAttributes({
  protocol,
  filterPolicy,
  rawMessageDelivery,
  subscriptionRoleArn,
}: {
  protocol: string;
  filterPolicy: string | undefined;
  rawMessageDelivery: string | undefined;
  subscriptionRoleArn: string | undefined;
}): Record<string, string> | undefined {
  const attributes: Record<string, string> = {};
  if (protocol === 'firehose') {
    if (isNil(subscriptionRoleArn) || subscriptionRoleArn === '') {
      throw new Error('Subscription Role ARN is required for firehose subscriptions (an IAM role SNS can assume to write to the delivery stream).');
    }
    if (!/^arn:aws[a-z-]*:iam::\d{12}:role\/.+$/.test(subscriptionRoleArn)) {
      throw new Error('Subscription Role ARN must be an IAM role ARN, e.g. arn:aws:iam::123456789012:role/sns-firehose.');
    }
    attributes['SubscriptionRoleArn'] = subscriptionRoleArn;
  }
  if (!isNil(filterPolicy) && filterPolicy !== '') {
    validateJsonText({ label: 'Filter Policy', value: filterPolicy });
    attributes['FilterPolicy'] = filterPolicy;
  }
  if (rawMessageDelivery === 'yes') {
    if (!RAW_DELIVERY_PROTOCOLS.includes(protocol)) {
      throw new Error('Raw Message Delivery is only supported for sqs, http, https and firehose subscriptions.');
    }
    attributes['RawMessageDelivery'] = 'true';
  }
  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

export const subscribeAction = createAction({
  auth: amazonSnsAuth,
  name: 'subscribe',
  classification: 'WRITE',
  displayName: 'Subscribe to Topic',
  description:
    'Subscribes an endpoint (email, phone, URL, SQS queue, Lambda function, ...) to a topic. Email and HTTP/S endpoints receive a confirmation message first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Subscribes an endpoint to an SNS topic so it receives every message published there. Endpoint format depends on protocol: email address for email/email-json, E.164 phone for sms, URL for http/https, ARN for sqs/lambda/firehose/application; firehose also needs Subscription Role ARN. Email and http/https subscriptions send a confirmation message and stay pending until the recipient confirms. Optional filter policy (JSON) limits which messages are delivered. Idempotent: subscribing the same endpoint to the same topic returns the existing subscription.',
    idempotent: true,
  },
  props: {
    topic_arn: topicDropdown({
      displayName: 'Topic',
      description: 'The topic to subscribe to.',
      required: true,
    }),
    protocol: Property.StaticDropdown<string, true>({
      displayName: 'Protocol',
      description: 'How messages are delivered to the endpoint.',
      required: true,
      options: {
        options: PROTOCOLS.map((value) => ({ label: value, value })),
      },
    }),
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      description:
        'Email address (email, email-json), E.164 phone number (sms), URL (http, https) or ARN (sqs, lambda, firehose, application).',
      required: true,
    }),
    filter_policy: Property.LongText({
      displayName: 'Filter Policy',
      description:
        'Optional JSON filter policy on message attributes, e.g. {"event_type": ["order_placed"]}. Only matching messages are delivered.',
      required: false,
    }),
    raw_message_delivery: Property.StaticDropdown<string, false>({
      displayName: 'Raw Message Delivery',
      description: 'Yes to deliver the raw message body without the SNS JSON envelope (sqs, http/s, firehose only).',
      required: false,
      defaultValue: 'no',
      options: yesNoOptions,
    }),
    subscription_role_arn: Property.ShortText({
      displayName: 'Subscription Role ARN',
      description: 'Required for firehose only: ARN of an IAM role that SNS assumes to write to the Firehose delivery stream.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'subscription_arn', label: 'Subscription ARN' },
      {
        key: 'pending_confirmation',
        label: 'Pending Confirmation',
        format: 'boolean',
        description: 'True until the endpoint confirms (email, http/s). Null if SNS did not report the status.',
      },
      { key: 'topic_arn', label: 'Topic ARN' },
      { key: 'protocol', label: 'Protocol' },
      { key: 'endpoint', label: 'Endpoint' },
    ],
  },
  async run(context) {
    const topicArn = context.propsValue.topic_arn.trim();
    const protocol = context.propsValue.protocol;
    if (!PROTOCOLS.includes(protocol)) {
      throw new Error(`Protocol must be one of: ${PROTOCOLS.join(', ')}.`);
    }
    const endpoint = context.propsValue.endpoint.trim();
    const attributes = buildSubscribeAttributes({
      protocol,
      filterPolicy: context.propsValue.filter_policy?.trim(),
      rawMessageDelivery: context.propsValue.raw_message_delivery ?? undefined,
      subscriptionRoleArn: context.propsValue.subscription_role_arn?.trim(),
    });
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const response = await callSns({
      operation: 'subscribe',
      call: () =>
        client.send(
          new sdk.SubscribeCommand({
            TopicArn: topicArn,
            Protocol: protocol,
            Endpoint: endpoint,
            Attributes: attributes,
            ReturnSubscriptionArn: true,
          })
        ),
    });
    const subscriptionArn = response.SubscriptionArn ?? null;
    let pendingConfirmation: boolean | null = null;
    if (!isNil(subscriptionArn)) {
      try {
        const details = await client.send(
          new sdk.GetSubscriptionAttributesCommand({ SubscriptionArn: subscriptionArn })
        );
        const pending = details.Attributes?.['PendingConfirmation'];
        pendingConfirmation = isNil(pending) ? null : pending === 'true';
      } catch {
        pendingConfirmation = null;
      }
    }
    return {
      subscription_arn: subscriptionArn,
      pending_confirmation: pendingConfirmation,
      topic_arn: topicArn,
      protocol,
      endpoint,
    };
  },
});

export { buildSubscribeAttributes, validateJsonText };
