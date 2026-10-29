import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { numericId, patchRecord, seg } from '../common/client';
import { productOptions, variantOptions } from '../common/props';
import { flatFields, recordSchema } from '../common/output-schemas';

export const changeSubscriptionPlan = createAction({
  auth: lemonSqueezyAuth,
  name: 'change_subscription_plan',
  displayName: 'Change Subscription Plan',
  description: 'Move a subscription to another variant (plan). This can charge the customer.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a Lemon Squeezy subscription to another variant (plan) by subscription ID and variant ID. Can charge the customer: prorated by default, immediately if requested. Repeating the same change leaves the subscription unchanged.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.subscription),
  props: {
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The numeric ID of the subscription.',
      required: true,
    }),
    productId: Property.Dropdown({
      displayName: 'Product',
      description: 'Select a product to filter the variant list below.',
      required: false,
      auth: lemonSqueezyAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => productOptions({ auth }),
    }),
    variantId: Property.Dropdown({
      displayName: 'New Variant',
      description: 'The variant (plan) to move the subscription to.',
      required: true,
      auth: lemonSqueezyAuth,
      refreshers: ['auth', 'productId'],
      options: async ({ auth, productId }) => variantOptions({ auth, productId }),
    }),
    invoiceImmediately: Property.Checkbox({
      displayName: 'Charge Prorated Amount Now',
      description: 'Charge the prorated difference now, not at the next renewal.',
      required: false,
      defaultValue: false,
    }),
    disableProrations: Property.Checkbox({
      displayName: 'Disable Proration',
      description: 'Bill the new price from the next renewal, without proration.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    if (propsValue.invoiceImmediately && propsValue.disableProrations) {
      throw new Error('Choose either Charge Prorated Amount Now or Disable Proration, not both.');
    }
    const variantId = Number(numericId({ value: propsValue.variantId, label: 'New Variant' }));
    const attributes: Record<string, unknown> = { variant_id: variantId };
    if (propsValue.invoiceImmediately) attributes['invoice_immediately'] = true;
    if (propsValue.disableProrations) attributes['disable_prorations'] = true;
    const id = numericId({ value: propsValue.subscriptionId, label: 'Subscription ID' });
    return patchRecord({ apiKey: auth.secret_text, type: 'subscriptions', path: `/subscriptions/${seg({ value: id, label: 'Subscription ID' })}`, id: id, attributes: attributes });
  },
});
