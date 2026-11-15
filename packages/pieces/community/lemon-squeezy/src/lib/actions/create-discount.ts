import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createRecord, isoDateOrUndefined, numericId } from '../common/client';
import { storeDropdown } from '../common/props';
import { flatFields, recordSchema } from '../common/output-schemas';

export const createDiscount = createAction({
  auth: lemonSqueezyAuth,
  name: 'create_discount',
  displayName: 'Create Discount',
  description: 'Create a discount code in a store.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a discount code in a Lemon Squeezy store: percent (1-100) or fixed amount in cents, optional redemption limit, start/expiry dates (ISO 8601) and duration for subscriptions (once, repeating with months, forever). Not idempotent: codes must be unique, so a repeat call with the same code fails.',
    idempotent: false,
  },
  outputSchema: recordSchema(flatFields.discount),
  props: {
    storeId: storeDropdown({ required: true, description: 'The store the discount belongs to.' }),
    name: Property.ShortText({ displayName: 'Name', description: 'Internal name, for example "Black Friday".', required: true }),
    code: Property.ShortText({ displayName: 'Code', description: 'The code customers enter: 3-256 uppercase letters and numbers.', required: true }),
    amountType: Property.StaticDropdown({
      displayName: 'Amount Type',
      required: true,
      defaultValue: 'percent',
      options: { options: [{ label: 'Percent', value: 'percent' }, { label: 'Fixed amount (cents)', value: 'fixed' }] },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Percent off (1-100) or a fixed amount in cents (500 = $5.00).',
      required: true,
    }),
    maxRedemptions: Property.Number({ displayName: 'Max Redemptions', description: 'Leave empty for unlimited.', required: false }),
    startsAt: Property.ShortText({ displayName: 'Starts At', description: 'ISO 8601 date-time. Leave empty to start now.', required: false }),
    expiresAt: Property.ShortText({ displayName: 'Expires At', description: 'ISO 8601 date-time. Leave empty for no expiry.', required: false }),
    duration: Property.StaticDropdown({
      displayName: 'Duration (subscriptions)',
      description: 'How long the discount applies to a subscription.',
      required: false,
      defaultValue: 'once',
      options: { options: [{ label: 'Once', value: 'once' }, { label: 'Repeating', value: 'repeating' }, { label: 'Forever', value: 'forever' }] },
    }),
    durationInMonths: Property.Number({ displayName: 'Duration in Months', description: 'Required when Duration is Repeating.', required: false }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const storeId = numericId({ value: propsValue.storeId, label: 'Store' });
    const code = String(propsValue.code ?? '').trim();
    if (!/^[A-Z0-9]{3,256}$/.test(code)) throw new Error('Code must be 3-256 uppercase letters (A-Z) and numbers.');
    const amountType = propsValue.amountType;
    if (amountType !== 'percent' && amountType !== 'fixed') throw new Error('Amount Type must be percent or fixed.');
    const amount = Number(propsValue.amount);
    if (!Number.isInteger(amount) || amount < 1 || (amountType === 'percent' && amount > 100)) {
      throw new Error(amountType === 'percent' ? 'Amount must be a whole percent between 1 and 100.' : 'Amount must be a whole number of cents (1 or more).');
    }
    const attributes: Record<string, unknown> = { name: propsValue.name, code, amount, amount_type: amountType };
    if (propsValue.maxRedemptions !== undefined && propsValue.maxRedemptions !== null) {
      const max = Number(propsValue.maxRedemptions);
      if (!Number.isInteger(max) || max < 1) throw new Error('Max Redemptions must be a whole number of 1 or more.');
      attributes['is_limited_redemptions'] = true;
      attributes['max_redemptions'] = max;
    }
    const startsAt = isoDateOrUndefined({ value: propsValue.startsAt, label: 'Starts At' });
    const expiresAt = isoDateOrUndefined({ value: propsValue.expiresAt, label: 'Expires At' });
    if (startsAt && expiresAt && Date.parse(expiresAt) <= Date.parse(startsAt)) throw new Error('Expires At must be after Starts At.');
    if (startsAt) attributes['starts_at'] = startsAt;
    if (expiresAt) attributes['expires_at'] = expiresAt;
    const duration = propsValue.duration || 'once';
    attributes['duration'] = duration;
    if (duration === 'repeating') {
      const months = Number(propsValue.durationInMonths);
      if (!Number.isInteger(months) || months < 1) throw new Error('Duration in Months must be a whole number of 1 or more when Duration is Repeating.');
      attributes['duration_in_months'] = months;
    }
    return createRecord({
      apiKey: auth.secret_text,
      path: '/discounts',
      type: 'discounts',
      attributes,
      relationships: { store: { data: { type: 'stores', id: storeId } } },
    });
  },
});
