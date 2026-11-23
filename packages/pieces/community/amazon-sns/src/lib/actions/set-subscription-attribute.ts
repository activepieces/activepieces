import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient } from '../common/client';
import { subscriptionDropdown } from '../common/props';
import { validateJsonText } from './subscribe';

const ATTRIBUTES = [
  'FilterPolicy',
  'FilterPolicyScope',
  'RawMessageDelivery',
  'RedrivePolicy',
  'DeliveryPolicy',
];

function normalizeAttributeValue({ attribute, value }: { attribute: string; value: string }): string {
  if (!ATTRIBUTES.includes(attribute)) {
    throw new Error(`Attribute must be one of: ${ATTRIBUTES.join(', ')}.`);
  }
  if (attribute === 'RawMessageDelivery') {
    const lower = value.toLowerCase();
    if (lower !== 'true' && lower !== 'false') {
      throw new Error('RawMessageDelivery must be "true" or "false".');
    }
    return lower;
  }
  if (attribute === 'FilterPolicyScope') {
    if (value !== 'MessageAttributes' && value !== 'MessageBody') {
      throw new Error('FilterPolicyScope must be "MessageAttributes" or "MessageBody".');
    }
    return value;
  }
  if (attribute === 'FilterPolicy' && value === '') {
    return value;
  }
  validateJsonText({ label: attribute, value });
  return value;
}

export const setSubscriptionAttributeAction = createAction({
  auth: amazonSnsAuth,
  name: 'set_subscription_attribute',
  classification: 'WRITE',
  displayName: 'Set Subscription Attribute',
  description: 'Changes one setting of a subscription, such as its filter policy or raw message delivery.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sets one attribute of an SNS subscription (pending or confirmed) without resubscribing. FilterPolicy and DeliveryPolicy/RedrivePolicy take JSON objects (an empty FilterPolicy removes filtering); FilterPolicyScope takes MessageAttributes or MessageBody; RawMessageDelivery takes true or false. Idempotent: setting the same value again leaves the subscription unchanged.',
    idempotent: true,
  },
  props: {
    subscription_arn: subscriptionDropdown({
      description: 'The subscription to change. The list shows confirmed subscriptions only; for a pending one, enter the ARN returned by Subscribe to Topic.',
    }),
    attribute: Property.StaticDropdown<string, true>({
      displayName: 'Attribute',
      description: 'The setting to change.',
      required: true,
      options: {
        options: ATTRIBUTES.map((value) => ({ label: value, value })),
      },
    }),
    value: Property.LongText({
      displayName: 'Value',
      description:
        'JSON for FilterPolicy, RedrivePolicy and DeliveryPolicy; "MessageAttributes" or "MessageBody" for FilterPolicyScope; "true" or "false" for RawMessageDelivery.',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'subscription_arn', label: 'Subscription ARN' },
      { key: 'attribute', label: 'Attribute' },
      { key: 'value', label: 'Value' },
    ],
  },
  async run(context) {
    const subscriptionArn = context.propsValue.subscription_arn.trim();
    const attribute = context.propsValue.attribute;
    const value = normalizeAttributeValue({ attribute, value: context.propsValue.value.trim() });
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    await callSns({
      operation: 'set subscription attribute',
      call: () =>
        client.send(
          new sdk.SetSubscriptionAttributesCommand({
            SubscriptionArn: subscriptionArn,
            AttributeName: attribute,
            AttributeValue: value,
          })
        ),
    });
    return { subscription_arn: subscriptionArn, attribute, value };
  },
});

export { normalizeAttributeValue };
