import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const cancelSubscriptionAction = createAction({
  name: 'cancel_subscription',
  auth: outsetaAuth,
  displayName: 'Cancel Subscription',
  description:
    'Cancel the current subscription on an account. By default, the subscription expires at the end of the current term. You can also cancel immediately.',
  audience: 'both',
  aiMetadata: {
    description:
      "Requests cancellation of an account's current subscription, identified by account UID. Defaults to expiring at the end of the current billing term; with cancel-immediately enabled it also forces the account to the Expired stage right away. Use to churn or downgrade an account. Optional cancellation reason and comment can be recorded. Not idempotent: it mutates subscription/account state.",
    idempotent: false,
  },
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account whose subscription to cancel.',
      required: true,
    }),
    cancelImmediately: Property.Checkbox({
      displayName: 'Cancel Immediately',
      required: false,
      defaultValue: false,
      description:
        'If checked, the subscription is cancelled immediately. Otherwise it expires at the end of the current billing term.',
    }),
    cancellationReason: Property.ShortText({
      displayName: 'Cancellation Reason',
      required: false,
      description: 'Reason for the cancellation (e.g. "Too expensive").',
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      required: false,
      description: 'Additional comment about the cancellation.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      Account: { Uid: context.propsValue.accountUid },
    };

    if (context.propsValue.cancellationReason) {
      // "CancelationReason" is the correct field name per Outseta's API (single 'l')
      body['CancelationReason'] = context.propsValue.cancellationReason;
    }
    if (context.propsValue.comment) {
      body['Comment'] = context.propsValue.comment;
    }

    await client.put<any>(
      `/api/v1/crm/accounts/cancellation/${context.propsValue.accountUid}`,
      body
    );

    // Outseta has no dedicated "cancel now" endpoint — the cancellation request
    // above only schedules expiry at renewal. Setting AccountStage=6 (Expired)
    // forces immediate expiry. We expand the same nested collections as
    // update-account.ts / manage-account-membership.ts and flatten any enveloped
    // arrays before PUT, otherwise the server can interpret {items: […]} as
    // empty and silently wipe billing / memberships / subscriptions.
    if (context.propsValue.cancelImmediately) {
      const account = await client.get<any>(
        `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=*,BillingAddress.*,MailingAddress.*,PrimaryContact.*,PersonAccount.*,PersonAccount.Person.*,Subscriptions.*`
      );
      account.AccountStage = 6;

      if (account.PersonAccount && !Array.isArray(account.PersonAccount)) {
        account.PersonAccount =
          account.PersonAccount.items ?? account.PersonAccount.Items ?? [];
      }
      if (account.Subscriptions && !Array.isArray(account.Subscriptions)) {
        account.Subscriptions =
          account.Subscriptions.items ?? account.Subscriptions.Items ?? [];
      }

      await client.put<any>(
        `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
        account
      );
    }

    return {
      account_uid: context.propsValue.accountUid,
      cancelled: true,
      cancelled_immediately: context.propsValue.cancelImmediately ?? false,
    };
  },
});
