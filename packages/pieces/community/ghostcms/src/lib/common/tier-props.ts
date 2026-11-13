import { Property } from '@activepieces/pieces-framework';

export const TIER_QUERY = { include: 'monthly_price,yearly_price,benefits' };

export const TIER_FIELDS = [
  'name',
  'description',
  'monthly_price',
  'yearly_price',
  'currency',
  'visibility',
  'welcome_page_url',
  'trial_days',
];

export const tierProps = (mode: 'create' | 'update') => ({
  name: Property.ShortText({
    displayName: 'Name',
    description: 'The tier name shown on the pricing page.',
    required: mode === 'create',
  }),
  description: Property.LongText({
    displayName: 'Description',
    description: 'A short description shown on the pricing page.',
    required: false,
  }),
  monthly_price: Property.Number({
    displayName: 'Monthly Price',
    description: 'The monthly price in the smallest currency unit, e.g. 500 for 5.00 USD.',
    required: false,
  }),
  yearly_price: Property.Number({
    displayName: 'Yearly Price',
    description: 'The yearly price in the smallest currency unit, e.g. 5000 for 50.00 USD.',
    required: false,
  }),
  currency: Property.ShortText({
    displayName: 'Currency',
    description: 'The three-letter currency code, e.g. usd. Required with a price.',
    required: false,
  }),
  benefits: Property.Array({
    displayName: 'Benefits',
    description: `The benefit lines shown on the pricing page.${
      mode === 'update' ? ' Supplying benefits replaces the full list, and an empty list removes every benefit.' : ''
    }`,
    required: false,
  }),
  visibility: Property.StaticDropdown({
    displayName: 'Visibility',
    description: 'Whether the tier is shown on the public pricing page.',
    required: false,
    options: {
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Hidden', value: 'none' },
      ],
    },
  }),
  welcome_page_url: Property.ShortText({
    displayName: 'Welcome Page URL',
    description: 'Where new subscribers of this tier land after signup.',
    required: false,
  }),
  trial_days: Property.Number({
    displayName: 'Trial Days',
    description: 'The free trial length in days. 0 for no trial.',
    required: false,
  }),
});
