import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const createDiscountAction = createAction({
  name: 'create_discount',
  auth: outsetaAuth,
  displayName: 'Create Discount',
  description:
    'Create a new discount coupon in the Outseta billing catalog. Either AmountOff or PercentOff must be set, never both.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a discount coupon in the billing catalog (fixed amount or percentage, with a duration). Use to define a new promotion code; to apply an existing coupon to a subscriber use Apply Discount to Account. Set either Amount Off or Percent Off, not both. Not idempotent: each call creates a new coupon.',
    idempotent: false,
  },
  props: {
    uniqueIdentifier: Property.ShortText({
      displayName: 'Coupon Code',
      required: true,
      description: 'The public code customers enter to redeem the discount (e.g. "RENTREE2026").',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'Display name of the discount (e.g. "Rentrée -10%").',
    }),
    isActive: Property.Checkbox({
      displayName: 'Is Active',
      required: false,
      defaultValue: true,
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      required: true,
      defaultValue: 1,
      options: {
        disabled: false,
        options: [
          { label: 'Forever', value: 1 },
          { label: 'Once', value: 2 },
          { label: 'Repeating (X months)', value: 3 },
        ],
      },
    }),
    durationInMonths: Property.Number({
      displayName: 'Duration in Months',
      required: false,
      description: 'Required when Duration is set to Repeating. Ignored otherwise.',
    }),
    amountOff: Property.Number({
      displayName: 'Amount Off',
      required: false,
      description: 'Fixed amount discount (in your account currency). Set this OR Percent Off, not both.',
    }),
    percentOff: Property.Number({
      displayName: 'Percent Off',
      required: false,
      description: 'Percentage discount (0-100). Set this OR Amount Off, not both.',
    }),
    maxRedemptions: Property.Number({
      displayName: 'Max Redemptions',
      required: false,
      description: 'Maximum number of times the coupon can be redeemed across all customers.',
    }),
    redeemBy: Property.DateTime({
      displayName: 'Redeem By',
      required: false,
      description: 'Coupon expiration date.',
    }),
  },
  async run(context) {
    const { amountOff, percentOff, duration, durationInMonths } = context.propsValue;

    if ((amountOff == null) === (percentOff == null)) {
      throw new Error('Provide exactly one of Amount Off or Percent Off (not both, not neither).');
    }
    if (duration === 3 && durationInMonths == null) {
      throw new Error('Duration in Months is required when Duration is set to Repeating.');
    }

    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      UniqueIdentifier: context.propsValue.uniqueIdentifier,
      Name: context.propsValue.name,
      IsActive: context.propsValue.isActive ?? true,
      Duration: duration,
    };
    if (amountOff != null) body['AmountOff'] = amountOff;
    if (percentOff != null) body['PercentOff'] = percentOff;
    if (durationInMonths != null) body['DurationInMonths'] = durationInMonths;
    if (context.propsValue.maxRedemptions != null) body['MaxRedemptions'] = context.propsValue.maxRedemptions;
    if (context.propsValue.redeemBy) body['RedeemBy'] = context.propsValue.redeemBy;

    return client.post<unknown>('/api/v1/billing/discountcoupons', body);
  },
});
