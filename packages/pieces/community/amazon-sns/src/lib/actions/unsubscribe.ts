import { createAction } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { createSnsClient } from '../common/client';
import { mapSnsError } from '../common/errors';
import { subscriptionDropdown } from '../common/props';

function assertConfirmedArn({ arn }: { arn: string }): void {
  if (!arn.startsWith('arn:')) {
    throw new Error(
      'This subscription is still pending confirmation ("PendingConfirmation" is not an ARN), so it cannot be unsubscribed. AWS deletes unconfirmed subscriptions after 3 days, or you can delete the topic.'
    );
  }
}

function mapUnsubscribeError({ error }: { error: unknown }): Error {
  if (error instanceof Error && /pending confirmation/i.test(error.message)) {
    return new Error(
      `Amazon SNS unsubscribe failed: the subscription is still pending confirmation. AWS deletes unconfirmed subscriptions after 3 days, or you can delete the topic. (${error.name}: ${error.message})`
    );
  }
  return mapSnsError({ operation: 'unsubscribe', error });
}

export const unsubscribeAction = createAction({
  auth: amazonSnsAuth,
  name: 'unsubscribe',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe',
  description: 'Deletes a confirmed subscription so its endpoint stops receiving messages from the topic. Subscriptions pending confirmation cannot be deleted.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a confirmed SNS subscription by its subscription ARN (from List Subscriptions or Subscribe to Topic); the endpoint stops receiving that topic\'s messages. Subscriptions still pending confirmation cannot be unsubscribed, even with a full ARN from Subscribe to Topic: AWS rejects the call, and it deletes unconfirmed subscriptions itself after 3 days (or delete the topic). Safe to retry: repeating the call for an already-deleted subscription succeeds.',
    idempotent: true,
  },
  props: {
    subscription_arn: subscriptionDropdown({
      description: 'The confirmed subscription to delete.',
    }),
  },
  outputSchema: {
    fields: [
      { key: 'unsubscribed', label: 'Unsubscribed', format: 'boolean' },
      { key: 'subscription_arn', label: 'Subscription ARN' },
    ],
  },
  async run(context) {
    const subscriptionArn = context.propsValue.subscription_arn.trim();
    assertConfirmedArn({ arn: subscriptionArn });
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    try {
      await client.send(new sdk.UnsubscribeCommand({ SubscriptionArn: subscriptionArn }));
    } catch (error) {
      throw mapUnsubscribeError({ error });
    }
    return { unsubscribed: true, subscription_arn: subscriptionArn };
  },
});

export { assertConfirmedArn, mapUnsubscribeError };
