import { describe, expect, it, vi, beforeEach } from 'vitest';

const sent: { name: string; input: Record<string, unknown> }[] = [];
const responses: unknown[] = [];
const createdClients: unknown[] = [];

function makeCommand({ name }: { name: string }) {
  return class {
    readonly commandName = name;
    constructor(readonly input: Record<string, unknown>) {}
  };
}

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: class {
    constructor(config: unknown) {
      createdClients.push(config);
    }
    async send(command: { commandName: string; input: Record<string, unknown> }) {
      sent.push({ name: command.commandName, input: command.input });
      const next = responses.shift();
      if (next instanceof Error) {
        throw next;
      }
      return next ?? {};
    }
  },
  PublishCommand: makeCommand({ name: 'Publish' }),
  ListTopicsCommand: makeCommand({ name: 'ListTopics' }),
  GetTopicAttributesCommand: makeCommand({ name: 'GetTopicAttributes' }),
  CreateTopicCommand: makeCommand({ name: 'CreateTopic' }),
  DeleteTopicCommand: makeCommand({ name: 'DeleteTopic' }),
  ListSubscriptionsCommand: makeCommand({ name: 'ListSubscriptions' }),
  ListSubscriptionsByTopicCommand: makeCommand({ name: 'ListSubscriptionsByTopic' }),
  SubscribeCommand: makeCommand({ name: 'Subscribe' }),
  GetSubscriptionAttributesCommand: makeCommand({ name: 'GetSubscriptionAttributes' }),
  SetSubscriptionAttributesCommand: makeCommand({ name: 'SetSubscriptionAttributes' }),
  UnsubscribeCommand: makeCommand({ name: 'Unsubscribe' }),
}));

import { collectPages } from '../src/lib/common/client';
import { mapSnsError } from '../src/lib/common/errors';
import { buildMessageAttributes, sendMessageAction, validateFifoInput } from '../src/lib/actions/send-message';
import { normalizePhoneNumber, validateSenderId } from '../src/lib/actions/send-sms';
import { buildTopicAttributes, validateTopicName } from '../src/lib/actions/create-topic';
import { mapTopicAttributes } from '../src/lib/actions/get-topic';
import { listTopicsAction } from '../src/lib/actions/list-topics';
import { mapSubscription, subscriptionStatus } from '../src/lib/actions/list-subscriptions';
import { buildSubscribeAttributes } from '../src/lib/actions/subscribe';
import { normalizeAttributeValue } from '../src/lib/actions/set-subscription-attribute';
import { amazonSns } from '../src/index';
import { topicDropdown, subscriptionDropdown } from '../src/lib/common/props';
import { assertConfirmedArn, mapUnsubscribeError } from '../src/lib/actions/unsubscribe';

const auth = {
  props: { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1', endpoint: '' },
};

function runContext({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { auth, propsValue };
}

function dropdownContext() {
  return {
    searchValue: undefined,
    server: { apiUrl: '', publicUrl: '', token: '' },
    project: { id: 'p', externalId: async () => undefined },
    flows: { current: { id: 'f', version: { id: 'v' } }, list: async () => ({ data: [], next: null, previous: null }) },
    connections: { get: async () => null },
    files: { write: async () => '' },
    store: {},
  };
}

function awsError({ name, message }: { name: string; message: string }): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

beforeEach(() => {
  sent.length = 0;
  responses.length = 0;
});

describe('collectPages', () => {
  it('follows NextToken until exhausted', async () => {
    const pages = [
      { items: [1, 2], nextToken: 'a' },
      { items: [3], nextToken: undefined },
    ];
    const result = await collectPages({
      operation: 'list',
      noun: 'things',
      cap: 10,
      onCap: 'throw',
      fetchPage: async () => pages.shift() ?? { items: [], nextToken: undefined },
    });
    expect(result).toEqual({ items: [1, 2, 3], truncated: false });
  });

  it('throws at the cap when more pages remain', async () => {
    await expect(
      collectPages({
        operation: 'list topics',
        noun: 'topics',
        cap: 2,
        onCap: 'throw',
        fetchPage: async () => ({ items: [1, 2], nextToken: 'more' }),
      })
    ).rejects.toThrow('more than 2 topics');
  });

  it('truncates at the cap for dropdowns', async () => {
    const result = await collectPages({
      operation: 'list',
      noun: 'things',
      cap: 3,
      onCap: 'truncate',
      fetchPage: async () => ({ items: [1, 2], nextToken: 'more' }),
    });
    expect(result).toEqual({ items: [1, 2, 1], truncated: true });
  });

  it('does not throw when the cap is hit on the last page', async () => {
    const result = await collectPages({
      operation: 'list',
      noun: 'things',
      cap: 2,
      onCap: 'throw',
      fetchPage: async () => ({ items: [1, 2], nextToken: undefined }),
    });
    expect(result.truncated).toBe(false);
  });
});

describe('mapSnsError', () => {
  it('adds a hint for known AWS errors', () => {
    const error = mapSnsError({
      operation: 'publish',
      error: awsError({ name: 'NotFoundException', message: 'Topic does not exist' }),
    });
    expect(error.message).toBe(
      'Amazon SNS publish failed: the topic or subscription was not found (check the ARN and region) (NotFoundException: Topic does not exist)'
    );
  });

  it('keeps vendor text for unknown errors', () => {
    const error = mapSnsError({ operation: 'subscribe', error: awsError({ name: 'Weird', message: 'boom' }) });
    expect(error.message).toBe('Amazon SNS subscribe failed: Weird: boom');
  });

  it('says a timed-out write may have been applied', () => {
    const error = mapSnsError({ operation: 'publish', error: awsError({ name: 'TimeoutError', message: 't' }) });
    expect(error.message).toContain('may still have been applied');
  });
});

describe('send message', () => {
  it('requires a group id for FIFO topics', () => {
    expect(() =>
      validateFifoInput({ topic: 'arn:aws:sns:us-east-1:1:t.fifo', messageGroupId: undefined, deduplicationId: undefined })
    ).toThrow('Message Group ID');
  });

  it('rejects a dedup id on standard topics', () => {
    expect(() =>
      validateFifoInput({ topic: 'arn:aws:sns:us-east-1:1:t', messageGroupId: undefined, deduplicationId: 'x' })
    ).toThrow('only applies to FIFO');
  });

  it('maps message attributes by type', () => {
    expect(buildMessageAttributes({ attributes: { a: 'x', b: 2 } })).toEqual({
      a: { DataType: 'String', StringValue: 'x' },
      b: { DataType: 'Number', StringValue: '2' },
    });
    expect(() => buildMessageAttributes({ attributes: { a: { nested: 1 } } })).toThrow('"a"');
    expect(() => buildMessageAttributes({ attributes: ['a'] })).toThrow('not an array');
    expect(() => buildMessageAttributes({ attributes: 'x' })).toThrow('JSON object');
  });

  it('publishes and returns a flat output', async () => {
    responses.push({ MessageId: 'm-1', $metadata: { httpStatusCode: 200 } });
    const output = await sendMessageAction.run(
      runContext({ propsValue: { topic: 'arn:aws:sns:us-east-1:1:t', message: 'hi' } })
    );
    expect(output).toEqual({
      message_id: 'm-1',
      sequence_number: null,
      topic_arn: 'arn:aws:sns:us-east-1:1:t',
      MessageId: 'm-1',
      SequenceNumber: null,
    });
    expect(output).not.toHaveProperty('$metadata');
    expect(sent[0]).toMatchObject({ name: 'Publish', input: { TopicArn: 'arn:aws:sns:us-east-1:1:t', Message: 'hi' } });
  });

  it('wraps AWS errors', async () => {
    responses.push(awsError({ name: 'AuthorizationErrorException', message: 'denied' }));
    await expect(
      sendMessageAction.run(runContext({ propsValue: { topic: 'arn:aws:sns:us-east-1:1:t', message: 'hi' } }))
    ).rejects.toThrow('Amazon SNS publish failed: the IAM user is not allowed');
  });
});

describe('send sms', () => {
  it('normalises E.164 numbers', () => {
    expect(normalizePhoneNumber({ value: '+1 (415) 555-0123' })).toBe('+14155550123');
    expect(() => normalizePhoneNumber({ value: '4155550123' })).toThrow('E.164');
  });

  it('validates sender ids', () => {
    expect(validateSenderId({ value: 'ACME1' })).toBe('ACME1');
    expect(() => validateSenderId({ value: '12345' })).toThrow('Sender ID');
  });
});

describe('create topic', () => {
  it('enforces the .fifo suffix rules', () => {
    expect(() => validateTopicName({ name: 'orders', fifo: true })).toThrow('must end in ".fifo"');
    expect(() => validateTopicName({ name: 'orders.fifo', fifo: false })).toThrow('Only FIFO');
    expect(() => validateTopicName({ name: 'bad name', fifo: false })).toThrow('Topic name');
    expect(() => validateTopicName({ name: 'orders.fifo', fifo: true })).not.toThrow();
  });

  it('builds attributes', () => {
    expect(buildTopicAttributes({ fifo: true, contentBasedDeduplication: true, displayName: 'X' })).toEqual({
      FifoTopic: 'true',
      ContentBasedDeduplication: 'true',
      DisplayName: 'X',
    });
    expect(() => buildTopicAttributes({ fifo: false, contentBasedDeduplication: true, displayName: undefined })).toThrow();
  });
});

describe('output mapping', () => {
  it('flattens topic attributes', () => {
    const output = mapTopicAttributes({
      topicArn: 'arn:aws:sns:us-east-1:1:t.fifo',
      attributes: { FifoTopic: 'true', SubscriptionsConfirmed: '3', Owner: '1' },
    });
    expect(output).toMatchObject({
      name: 't.fifo',
      fifo: true,
      content_based_deduplication: false,
      subscriptions_confirmed: 3,
      subscriptions_pending: null,
      owner: '1',
      display_name: null,
    });
  });

  it('maps empty string attributes to null', () => {
    const output = mapTopicAttributes({
      topicArn: 'arn:aws:sns:us-east-1:1:t',
      attributes: { DisplayName: '', KmsMasterKeyId: '  ', Owner: '1', Policy: '' },
    });
    expect(output).toMatchObject({ display_name: null, kms_master_key_id: null, policy: null, owner: '1' });
  });

  it('marks pending subscriptions', () => {
    expect(mapSubscription({ subscription: { SubscriptionArn: 'PendingConfirmation', Protocol: 'email' } })).toMatchObject({
      subscription_arn: null,
      pending_confirmation: true,
    });
  });

  it('lists topics across pages', async () => {
    responses.push(
      { Topics: [{ TopicArn: 'arn:aws:sns:us-east-1:1:a' }], NextToken: 'n' },
      { Topics: [{ TopicArn: 'arn:aws:sns:us-east-1:1:b.fifo' }] }
    );
    const output = await listTopicsAction.run(runContext({ propsValue: {} }));
    expect(output).toEqual({
      topics: [
        { topic_arn: 'arn:aws:sns:us-east-1:1:a', name: 'a', is_fifo: false },
        { topic_arn: 'arn:aws:sns:us-east-1:1:b.fifo', name: 'b.fifo', is_fifo: true },
      ],
      count: 2,
    });
    expect(sent[1].input).toEqual({ NextToken: 'n' });
  });
});

describe('subscriptions', () => {
  it('validates filter policy JSON and raw delivery protocol', () => {
    expect(() => buildSubscribeAttributes({ protocol: 'sqs', filterPolicy: '[1]', rawMessageDelivery: 'no', subscriptionRoleArn: undefined })).toThrow('JSON object');
    expect(() => buildSubscribeAttributes({ protocol: 'email', filterPolicy: undefined, rawMessageDelivery: 'yes', subscriptionRoleArn: undefined })).toThrow('Raw Message Delivery');
    expect(buildSubscribeAttributes({ protocol: 'sqs', filterPolicy: '{"a":["b"]}', rawMessageDelivery: 'yes', subscriptionRoleArn: undefined })).toEqual({
      FilterPolicy: '{"a":["b"]}',
      RawMessageDelivery: 'true',
    });
  });

  it('requires a valid role ARN for firehose', () => {
    expect(() => buildSubscribeAttributes({ protocol: 'firehose', filterPolicy: undefined, rawMessageDelivery: 'no', subscriptionRoleArn: undefined })).toThrow('Subscription Role ARN is required');
    expect(() => buildSubscribeAttributes({ protocol: 'firehose', filterPolicy: undefined, rawMessageDelivery: 'no', subscriptionRoleArn: 'role' })).toThrow('IAM role ARN');
    expect(buildSubscribeAttributes({ protocol: 'firehose', filterPolicy: undefined, rawMessageDelivery: 'yes', subscriptionRoleArn: 'arn:aws:iam::123456789012:role/sns-fh' })).toEqual({
      SubscriptionRoleArn: 'arn:aws:iam::123456789012:role/sns-fh',
      RawMessageDelivery: 'true',
    });
  });

  it('normalises attribute values', () => {
    expect(normalizeAttributeValue({ attribute: 'RawMessageDelivery', value: 'TRUE' })).toBe('true');
    expect(() => normalizeAttributeValue({ attribute: 'FilterPolicyScope', value: 'x' })).toThrow();
    expect(() => normalizeAttributeValue({ attribute: 'RedrivePolicy', value: 'nope' })).toThrow('JSON object');
  });

  it('explains the AWS pending-confirmation unsubscribe error', () => {
    const error = mapUnsubscribeError({
      error: awsError({ name: 'InvalidParameterException', message: 'Invalid parameter: Cannot unsubscribe a subscription that is pending confirmation' }),
    });
    expect(error.message).toContain('still pending confirmation');
    expect(error.message).toContain('after 3 days');
    expect(mapUnsubscribeError({ error: awsError({ name: 'NotFoundException', message: 'x' }) }).message).toContain('not found');
  });

  it('refuses pending subscriptions on unsubscribe', () => {
    expect(() => assertConfirmedArn({ arn: 'PendingConfirmation' })).toThrow('pending confirmation');
  });
});

describe('piece registration', () => {
  it('registers all 10 actions and auth', () => {
    expect(Object.keys(amazonSns.actions()).sort()).toEqual(
      [
        'send-message',
        'send_sms',
        'list_topics',
        'get_topic',
        'create_topic',
        'delete_topic',
        'list_subscriptions',
        'subscribe',
        'set_subscription_attribute',
        'unsubscribe',
      ].sort()
    );
    expect(amazonSns.auth).toBeDefined();
  });
});

describe('bug-hunt fixes', () => {
  it('returns legacy keys for FIFO publishes', async () => {
    responses.push({ MessageId: 'm-2', SequenceNumber: '100' });
    const output = await sendMessageAction.run(
      runContext({ propsValue: { topic: 'arn:aws:sns:us-east-1:1:t.fifo', message: 'hi', message_group_id: 'g' } })
    );
    expect(output).toMatchObject({ message_id: 'm-2', MessageId: 'm-2', sequence_number: '100', SequenceNumber: '100' });
    const keys = (sendMessageAction.outputSchema?.fields ?? []).map((field) => field.key);
    expect(keys).toEqual(expect.arrayContaining(['MessageId', 'SequenceNumber']));
  });

  it('parses message attributes given as a JSON string', () => {
    expect(buildMessageAttributes({ attributes: '{"a":"x","n":1}' })).toEqual({
      a: { DataType: 'String', StringValue: 'x' },
      n: { DataType: 'Number', StringValue: '1' },
    });
    expect(() => buildMessageAttributes({ attributes: '{bad' })).toThrow('not valid JSON');
    expect(() => buildMessageAttributes({ attributes: '["a"]' })).toThrow('not an array');
  });

  it('classifies subscription status', () => {
    expect(subscriptionStatus({ arn: 'arn:aws:sns:us-east-1:1:t:abc' })).toBe('confirmed');
    expect(subscriptionStatus({ arn: 'PendingConfirmation' })).toBe('pending_confirmation');
    expect(subscriptionStatus({ arn: 'Deleted' })).toBe('deleted');
    expect(mapSubscription({ subscription: { SubscriptionArn: 'Deleted' } })).toMatchObject({
      subscription_arn: null,
      status: 'deleted',
      pending_confirmation: false,
    });
  });

  it('trims credentials and endpoint', async () => {
    const { createSnsClient } = await import('../src/lib/common/client');
    const { client } = await createSnsClient({
      auth: { accessKeyId: ' AKIA ', secretAccessKey: ' secret \n', region: 'us-east-1', endpoint: ' ' },
    });
    expect(client).toBeDefined();
    expect(createdClients[createdClients.length - 1]).toEqual({
      credentials: { accessKeyId: 'AKIA', secretAccessKey: 'secret' },
      region: 'us-east-1',
      endpoint: undefined,
    });
  });
});

describe('dropdowns', () => {
  const topic = topicDropdown({ displayName: 'Topic', description: 'd', required: true });
  const subscription = subscriptionDropdown({ description: 'd' });

  it('asks for a connection when auth is missing', async () => {
    const result = await topic.options({ auth: undefined }, dropdownContext());
    expect(result).toMatchObject({ disabled: true, placeholder: 'Please connect your Amazon SNS account first' });
  });

  it('shows the cap placeholder when more topics remain', async () => {
    for (let page = 0; page < 10; page++) {
      responses.push({
        Topics: Array.from({ length: 100 }, (_, i) => ({ TopicArn: `arn:aws:sns:us-east-1:1:t${page}-${i}` })),
        NextToken: 'more',
      });
    }
    const result = await topic.options({ auth }, dropdownContext());
    expect(result.options).toHaveLength(1000);
    expect(result.placeholder).toContain('Showing the first 1000 topics');
  });

  it('shows the mapped error as placeholder', async () => {
    responses.push(awsError({ name: 'InvalidClientTokenId', message: 'bad key' }));
    const result = await subscription.options({ auth }, dropdownContext());
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toContain('Amazon SNS list subscriptions failed');
  });

  it('lists only confirmed subscriptions', async () => {
    responses.push({
      Subscriptions: [
        { SubscriptionArn: 'arn:aws:sns:us-east-1:1:t:s1', TopicArn: 'arn:aws:sns:us-east-1:1:t', Protocol: 'email', Endpoint: 'a@b.c' },
        { SubscriptionArn: 'PendingConfirmation', TopicArn: 'arn:aws:sns:us-east-1:1:t' },
        { SubscriptionArn: 'Deleted', TopicArn: 'arn:aws:sns:us-east-1:1:t' },
      ],
    });
    const result = await subscription.options({ auth }, dropdownContext());
    expect(result.options).toEqual([{ label: 't → email: a@b.c', value: 'arn:aws:sns:us-east-1:1:t:s1' }]);
  });
});
