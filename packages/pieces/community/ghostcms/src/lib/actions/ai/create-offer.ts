import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostCreateOfferOutputSchema } from '../../output-schemas';

export const ghostCreateOffer = createAction({
  auth: ghostAuth,
  name: 'ghost_create_offer',
  outputSchema: ghostCreateOfferOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Offer',
  description: 'Create a discount or free-trial offer for a paid tier.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a public discount or free-trial offer on a paid tier; anyone with the code or offer link can redeem it, so confirm the terms before calling. Percent and fixed offers need Duration, and a fixed offer needs Currency. Ghost rejects a code already in use.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The internal offer name.',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The code used in the offer URL, e.g. black-friday.',
      required: true,
    }),
    tier_id: Property.ShortText({
      displayName: 'Tier ID',
      description: 'The paid tier the offer applies to, from List Tiers.',
      required: true,
    }),
    cadence: Property.StaticDropdown({
      displayName: 'Cadence',
      description: 'Whether the offer applies to the monthly or the yearly price.',
      required: true,
      options: {
        options: [
          { label: 'Monthly', value: 'month' },
          { label: 'Yearly', value: 'year' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Percentage discount, fixed amount off, or a free trial.',
      required: true,
      options: {
        options: [
          { label: 'Percentage discount', value: 'percent' },
          { label: 'Fixed amount discount', value: 'fixed' },
          { label: 'Free trial', value: 'trial' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'Percent: 1 to 100. Fixed: the amount off in the smallest currency unit (500 = 5.00). Trial: the number of free days.',
      required: true,
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'How long a percent or fixed discount lasts. Ignored for trials.',
      required: false,
      options: {
        options: [
          { label: 'First payment only', value: 'once' },
          { label: 'Several months', value: 'repeating' },
          { label: 'Forever', value: 'forever' },
        ],
      },
    }),
    duration_in_months: Property.Number({
      displayName: 'Duration in Months',
      description: 'Required when Duration is Several months.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter currency code of a fixed discount, e.g. usd.',
      required: false,
    }),
    display_title: Property.ShortText({
      displayName: 'Display Title',
      description: 'The headline shown to visitors on the offer page.',
      required: false,
    }),
    display_description: Property.LongText({
      displayName: 'Display Description',
      description: 'The text shown to visitors on the offer page.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body = ghostResource.pick(props, ['name', 'code', 'cadence', 'type', 'display_title', 'display_description']);
    const amount = Number(props.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Amount must be a whole number above 0.');
    }
    body['amount'] = amount;
    body['tier'] = { id: props.tier_id.trim() };
    if (props.type === 'trial') {
      body['duration'] = 'trial';
    } else {
      if (!ghostCommon.hasText(props.duration)) {
        throw new Error('Duration is required for percent and fixed offers.');
      }
      body['duration'] = props.duration;
      if (props.duration === 'repeating') {
        const months = Number(props.duration_in_months);
        if (!Number.isInteger(months) || months <= 0) {
          throw new Error('Duration in Months is required when Duration is Several months.');
        }
        body['duration_in_months'] = months;
      }
      if (props.type === 'percent' && amount > 100) {
        throw new Error('A percentage discount cannot exceed 100.');
      }
      if (props.type === 'fixed') {
        if (!ghostCommon.hasText(props.currency)) {
          throw new Error('Currency is required for a fixed discount.');
        }
        body['currency'] = props.currency.trim().toLowerCase();
      }
    }
    return ghostResource.create(context.auth, 'offers', body);
  },
});
