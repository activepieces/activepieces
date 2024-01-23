import { Property, createAction } from '@activepieces/pieces-framework';
import { createDiscount } from '../api';
import { CartloomAuthType, cartloomAuth } from '../auth';
import { buildProductsDropdown } from '../props';

export const createDiscountAction = createAction({
  name: 'create_discount',
  auth: cartloomAuth,
  displayName: 'Create Discount',
  description: 'Create a discount in Cartloom',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Enter the title of the discount',
      required: true,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Is this discount enabled?',
      required: true,
      defaultValue: false,
    }),
    auto: Property.Checkbox({
      displayName: 'Auto',
      description: 'Is this discount automatically applied?',
      required: true,
      defaultValue: false,
    }),
    unlimited: Property.Checkbox({
      displayName: 'Unlimited',
      description: 'Is this discount unlimited?',
      required: true,
      defaultValue: false,
    }),
    selfDestruct: Property.Checkbox({
      displayName: 'Self Destruct',
      description: 'Remove the discount after use',
      required: true,
      defaultValue: false,
    }),
    applyOnce: Property.Checkbox({
      displayName: 'Apply Once',
      description: 'Apply the discount once per order',
      required: true,
      defaultValue: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type of Discount',
      description: 'Select the type of discount',
      defaultValue: 'fixed',
      required: true,
      options: {
        options: [
          { label: 'Fixed Amount', value: 'fixed' },
          { label: 'Percentage', value: 'percent' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Enter the amount of the discount',
      required: true,
      defaultValue: 0,
    }),
    target: Property.StaticDropdown({
      displayName: 'Discount Target',
      description: 'Select the target of the discount',
      defaultValue: 'all',
      required: true,
      options: {
        options: [
          { label: 'Selected Products', value: 'product' },
          { label: 'Total', value: 'total' },
          { label: 'All Products', value: 'all' },
        ],
      },
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'The start date of the discount. YYYY-MM-DD HH:MM:SS',
      required: true,
    }),
    stopDate: Property.DateTime({
      displayName: 'Stop Date',
      description: 'The stop date of the discount. YYYY-MM-DD HH:MM:SS',
      required: true,
    }),
    optional: Property.MarkDown({
      value: '## Optional Settings based on above settings',
    }),
    code: Property.ShortText({
      displayName: 'Discount Code',
      description: 'Enter the discount code. Leave blank for no code.',
      required: false,
    }),
    targetPids: Property.MultiSelectDropdown({
      displayName: 'Target Products',
      description: 'Select the products to apply the discount to',
      required: false,
      refreshers: [],
      options: async ({ auth }) =>
        await buildProductsDropdown(auth as CartloomAuthType),
    }),
    targetAmount: Property.Number({
      displayName: 'Target Amount',
      description:
        'The target amount for the discount when the target is set to Total',
      required: false,
    }),
    targetQuantity: Property.Number({
      displayName: 'Target Quantity',
      description:
        'The target quantity for the discount when the target is set to All or Products',
      required: false,
      defaultValue: 0,
    }),
    allowance: Property.Number({
      displayName: 'Allowance',
      description: 'The number of times the discount can be used',
      required: false,
    }),
  },
  async run(context) {
    return await createDiscount(context.auth, {
      enabled: context.propsValue.enabled ? 1 : 0,
      auto: context.propsValue.auto ? 1 : 0,
      unlimited: context.propsValue.unlimited ? 1 : 0,
      self_destruct: context.propsValue.selfDestruct ? 1 : 0,
      apply_once: context.propsValue.applyOnce ? 1 : 0,
      title: context.propsValue.title,
      type: context.propsValue.type,
      amount: context.propsValue.amount,
      target: context.propsValue.target,
      start_date: context.propsValue.startDate.split('T')[0],
      stop_date: context.propsValue.stopDate.split('T')[0],
      code: context.propsValue.code,
      target_pid: context.propsValue.targetPids?.join(','),
      target_amount: context.propsValue.targetAmount,
      target_quantity: context.propsValue.targetQuantity,
      allowance: context.propsValue.allowance,
    });
  },
});
