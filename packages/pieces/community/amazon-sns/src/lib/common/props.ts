import { Property } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import {
  collectPages,
  createSnsClient,
  SNS_LIST_CAP,
  topicNameFromArn,
} from './client';

function topicDropdown<R extends boolean>({
  displayName,
  description,
  required,
}: {
  displayName: string;
  description: string;
  required: R;
}) {
  return Property.Dropdown<string, R, typeof amazonSnsAuth>({
    auth: amazonSnsAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Amazon SNS account first',
        };
      }
      try {
        const { client, sdk } = await createSnsClient({ auth: auth.props });
        const { items, truncated } = await collectPages({
          operation: 'list topics',
          noun: 'topics',
          cap: SNS_LIST_CAP,
          onCap: 'truncate',
          fetchPage: async (nextToken) => {
            const page = await client.send(new sdk.ListTopicsCommand({ NextToken: nextToken }));
            return { items: page.Topics ?? [], nextToken: page.NextToken };
          },
        });
        const options = [];
        for (const topic of items) {
          if (topic.TopicArn) {
            options.push({
              label: topicNameFromArn({ arn: topic.TopicArn }),
              value: topic.TopicArn,
            });
          }
        }
        return {
          disabled: false,
          options,
          placeholder:
            options.length === 0
              ? 'No topics found in this region'
              : truncated
                ? `Showing the first ${SNS_LIST_CAP} topics; enter an ARN in custom mode for others`
                : undefined,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: e instanceof Error ? e.message : 'Could not load topics',
        };
      }
    },
  });
}

function subscriptionDropdown({ description }: { description: string }) {
  return Property.Dropdown<string, true, typeof amazonSnsAuth>({
    auth: amazonSnsAuth,
    displayName: 'Subscription',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Amazon SNS account first',
        };
      }
      try {
        const { client, sdk } = await createSnsClient({ auth: auth.props });
        const { items, truncated } = await collectPages({
          operation: 'list subscriptions',
          noun: 'subscriptions',
          cap: SNS_LIST_CAP,
          onCap: 'truncate',
          fetchPage: async (nextToken) => {
            const page = await client.send(
              new sdk.ListSubscriptionsCommand({ NextToken: nextToken })
            );
            return { items: page.Subscriptions ?? [], nextToken: page.NextToken };
          },
        });
        const options = [];
        for (const sub of items) {
          if (sub.SubscriptionArn && sub.SubscriptionArn.startsWith('arn:')) {
            const topic = sub.TopicArn ? topicNameFromArn({ arn: sub.TopicArn }) : '?';
            options.push({
              label: `${topic} → ${sub.Protocol ?? '?'}: ${sub.Endpoint ?? '?'}`,
              value: sub.SubscriptionArn,
            });
          }
        }
        return {
          disabled: false,
          options,
          placeholder:
            options.length === 0
              ? 'No confirmed subscriptions found in this region'
              : truncated
                ? `Showing the first ${SNS_LIST_CAP} subscriptions; enter an ARN in custom mode for others`
                : undefined,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: e instanceof Error ? e.message : 'Could not load subscriptions',
        };
      }
    },
  });
}

const yesNoOptions = {
  options: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
};

export { topicDropdown, subscriptionDropdown, yesNoOptions };
