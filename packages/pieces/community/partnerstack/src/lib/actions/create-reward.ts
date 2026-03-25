import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { partnerstackAuth } from '../auth';
import { PartnerStackReward, partnerstackApiCall } from '../common/client';

export const createRewardAction = createAction({
  auth: partnerstackAuth,
  name: 'create_reward',
  displayName: 'Create Reward',
  description: 'Create a PartnerStack reward for a customer, transaction, or manual target.',
  props: {
    amount: Property.Number({
      displayName: 'Amount (Cents)',
      description: 'Reward amount in cents.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
    }),
    targetType: Property.StaticDropdown({
      displayName: 'Target Type',
      required: true,
      options: {
        options: [
          { label: 'Customer', value: 'customer' },
          { label: 'Transaction', value: 'transaction' },
          { label: 'Manual', value: 'manual' },
        ],
      },
    }),
    targetKey: Property.ShortText({
      displayName: 'Target Key',
      description: 'The key of the target object in PartnerStack.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter currency code. Defaults to USD.',
      required: false,
      defaultValue: 'USD',
    }),
  },
  async run(context) {
    return await partnerstackApiCall<PartnerStackReward>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      resourceUri: '/v2/rewards',
      body: {
        amount: context.propsValue.amount,
        currency: context.propsValue.currency,
        description: context.propsValue.description,
        target: {
          type: context.propsValue.targetType,
          key: context.propsValue.targetKey,
        },
      },
    });
  },
});
