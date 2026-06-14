import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const extendTrialSubscriptionAction = createAction({
  name: 'extend_trial_subscription',
  auth: outsetaAuth,
  displayName: 'Extend Trial Subscription',
  description:
    "Extend the trial period of an account by setting a new trial end date.",
  audience: 'both',
  aiMetadata: {
    description:
      'Sets a new trial end date on an account\'s subscription, by account UID. Use to prolong a trial; the date must be in the future and is applied as an absolute target (yyyy-MM-dd). Idempotent: setting the same end date again has no further effect.',
    idempotent: true,
  },
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account whose trial to extend.',
      required: true,
    }),
    trialEndDate: Property.DateTime({
      displayName: 'New Trial End Date',
      required: true,
      description:
        'The new date when the trial should end. Must be in the future. Time-of-day is ignored — Outseta uses date only (yyyy-MM-dd).',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const isoDate = new Date(context.propsValue.trialEndDate)
      .toISOString()
      .slice(0, 10);

    await client.put<unknown>(
      `/api/v1/crm/accounts/extendtrial/${context.propsValue.accountUid}/${isoDate}`,
      {}
    );

    return {
      account_uid: context.propsValue.accountUid,
      new_trial_end_date: isoDate,
      extended: true,
    };
  },
});
