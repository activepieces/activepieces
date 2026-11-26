import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { CURRENCY_OPTIONS } from '../common/props';
import { chargekeepServices } from '../common/services';

export const createProduct = createAction({
  name: 'createProduct',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Creates a product, or updates the one with the same SKU.',
  audience: 'both',
  aiMetadata: { description: 'Creates or updates a product in the ChargeKeep/Sperse CRM with one price option. Requires productType (General, Event, Subscription, Digital), name and SKU (code, the upsert key). General/Event/Digital products take price and unit (one-time price). Subscription products take the subscription fee and payment cycle (Monthly, Annual, LifeTime, OneTime, Custom), plus optional signup fee, cycles, trial days and grace period. Reusing the same SKU updates that product and replaces its price option. Returns the product with its price options.', idempotent: true },
  outputSchema: chargekeepOutputSchemas.product,
  auth: chargekeepAuth,
  propertyGroups: [
    { key: 'product', display: 'section', label: 'Product', icon: 'tag', props: ['productType', 'name', 'code', 'groupName', 'currencyId', 'description', 'descriptionHTML', 'logoURL'] },
    { key: 'one_time', display: 'section', label: 'One-Time Price', icon: 'sliders', props: ['one_time_info', 'price', 'unit'] },
    { key: 'subscription', display: 'section', label: 'Subscription Price', icon: 'calendar', props: ['subscription_info', 'fee', 'frequency', 'signupFee', 'cycles', 'customPeriodType', 'customPeriodCount', 'trialDayCount', 'gracePeriodDayCount'] },
  ],
  props: {
    productType: Property.StaticDropdown({
      displayName: 'Product Type',
      required: true,
      defaultValue: 'General',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'General',
            value: 'General',
            description: 'Standard item',
            icon: 'tag',
          },
          {
            label: 'Event',
            value: 'Event',
            description: 'Ticketed event',
            icon: 'calendar',
          },
          {
            label: 'Subscription',
            value: 'Subscription',
            description: 'Recurring fee',
            icon: 'sliders',
          },
          {
            label: 'Digital',
            value: 'Digital',
            description: 'Online access',
            icon: 'file',
          },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      required: true,
      width: 'half',
    }),
    code: Property.ShortText({
      displayName: 'SKU',
      required: true,
      description: 'Your product code. Reusing it updates that product.',
      width: 'half',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    descriptionHTML: Property.LongText({
      displayName: 'HTML Description',
      required: false,
      description: 'Scripts and media tags are not allowed.',
    }),
    logoURL: Property.LongText({
      displayName: 'Logo URL',
      required: false,
    }),
    groupName: Property.ShortText({
      displayName: 'Group Name',
      required: false,
      width: 'half',
    }),
    one_time_info: Property.MarkDown({
      value: 'Used for General, Event and Digital products.',
      variant: MarkdownVariant.INFO,
    }),
    subscription_info: Property.MarkDown({
      value: 'Used only for Subscription products.',
      variant: MarkdownVariant.INFO,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
      description: 'Required for these product types.',
      width: 'half',
    }),
    currencyId: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      width: 'half',
      defaultValue: 'USD',
      options: { disabled: false, options: CURRENCY_OPTIONS },
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      required: false,
      description: 'Empty: Unit.',
      width: 'half',
      options: {
        disabled: false,
        options: [
          {
            label: 'Day',
            value: 'Day',
          },
          {
            label: 'Feet',
            value: 'Feet',
          },
          {
            label: 'Hour',
            value: 'Hour',
          },
          {
            label: 'Kilogram',
            value: 'Kilogram',
          },
          {
            label: 'Pound',
            value: 'Pound',
          },
          {
            label: 'Month',
            value: 'Month',
          },
          {
            label: 'Package',
            value: 'Package',
          },
          {
            label: 'Piece',
            value: 'Piece',
          },
          {
            label: 'Unit',
            value: 'Unit',
          },
          {
            label: 'Year',
            value: 'Year',
          },
          {
            label: 'Zone',
            value: 'Zone',
          },
          {
            label: 'Custom',
            value: 'Custom',
          },
        ],
      },
    }),
    frequency: Property.StaticDropdown({
      displayName: 'Billing Period',
      required: false,
      description: 'Empty: Monthly.',
      width: 'half',
      options: {
        disabled: false,
        options: [
          {
            label: 'Monthly',
            value: 'Monthly',
          },
          {
            label: 'Annual',
            value: 'Annual',
          },
          {
            label: 'Lifetime',
            value: 'LifeTime',
          },
          {
            label: 'One-time',
            value: 'OneTime',
          },
          {
            label: 'Custom',
            value: 'Custom',
          },
        ],
      },
    }),
    fee: Property.Number({
      displayName: 'Subscription Fee',
      description: 'Charged every billing period. Required.',
      required: false,
      width: 'half',
    }),
    cycles: Property.Number({
      displayName: 'Billing Cycles',
      required: false,
      description: 'How many times to charge. Empty: no limit.',
      width: 'half',
    }),
    signupFee: Property.Number({
      displayName: 'Signup Fee',
      required: false,
      description: 'Charged once at signup.',
      width: 'half',
    }),
    customPeriodType: Property.StaticDropdown({
      displayName: 'Custom Period Type',
      required: false,
      description: 'Period unit when Billing Period is Custom.',
      options: {
        disabled: false,
        options: [
          {
            label: 'Days',
            value: 'Days',
          },
          {
            label: 'Weeks',
            value: 'Weeks',
          },
          {
            label: 'Months',
            value: 'Months',
          },
          {
            label: 'Years',
            value: 'Years',
          },
        ],
      },
    }),
    customPeriodCount: Property.Number({
      displayName: 'Custom Period Count',
      required: false,
      description: 'Number of periods when Billing Period is Custom or One-time.',
    }),
    trialDayCount: Property.Number({
      displayName: 'Trial Days',
      required: false,
      description: 'Free days before the first charge.',
      width: 'half',
    }),
    gracePeriodDayCount: Property.Number({
      displayName: 'Grace Period Days',
      description: 'Days to wait after a missed payment.',
      width: 'half',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const { mapped } = await chargekeepServices.importProduct({
      auth: context.auth,
      input: {
        type: p.productType,
        name: p.name,
        code: p.code,
        description: p.description,
        descriptionHtml: p.descriptionHTML,
        logoUrl: p.logoURL,
        groupName: p.groupName,
        currencyId: p.currencyId,
        price: p.price,
        fee: p.fee,
        unit: p.unit,
        frequency: p.frequency,
        signupFee: p.signupFee,
        cycles: p.cycles,
        trialDayCount: p.trialDayCount,
        customPeriodCount: p.customPeriodCount,
        customPeriodType: p.customPeriodType,
        gracePeriodDayCount: p.gracePeriodDayCount,
      },
    });
    return mapped();
  },
});
