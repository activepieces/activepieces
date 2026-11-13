import { createAction, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { CURRENCY_OPTIONS } from '../common/props';
import { chargekeepServices } from '../common/services';

export const createProduct = createAction({
  name: 'createProduct',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Creates a product in the CRM, or updates the product with the same SKU.',
  audience: 'both',
  aiMetadata: { description: 'Creates or updates a product in the ChargeKeep/Sperse CRM with one price option. Requires productType (General, Event, Subscription, Digital), name and SKU (code, the upsert key). General/Event/Digital products take price and unit (one-time price). Subscription products take the subscription fee and payment cycle (Monthly, Annual, LifeTime, OneTime, Custom), plus optional signup fee, cycles, trial days and grace period. Reusing the same SKU updates that product and replaces its price option. Returns the product with its price options.', idempotent: true },
  outputSchema: chargekeepOutputSchemas.product,
  auth: chargekeepAuth,
  props: {
    productType: Property.StaticDropdown({
      displayName: 'Product Type',
      required: true,
      defaultValue: 'General',
      options: {
        disabled: false,
        options: [
          {
            label: 'General',
            value: 'General',
          },
          {
            label: 'Event',
            value: 'Event',
          },
          {
            label: 'Subscription',
            value: 'Subscription',
          },
          {
            label: 'Digital',
            value: 'Digital',
          },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'SKU',
      required: true,
      description: 'Sku is the product code',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    descriptionHTML: Property.LongText({
      displayName: 'Description HTML',
      required: false,
      description: 'Javascript and media tags are not allowed',
    }),
    logoURL: Property.LongText({
      displayName: 'Logo Url',
      required: false,
    }),
    groupName: Property.ShortText({
      displayName: 'Group Name',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
      description: 'One-time price. Required for General, Digital and Event products.',
    }),
    currencyId: Property.StaticDropdown({
      displayName: 'Currency Id',
      required: false,
      defaultValue: 'USD',
      options: { disabled: false, options: CURRENCY_OPTIONS },
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      required: false,
      description: 'Price unit for General, Digital and Event products. Defaults to Unit.',
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
      displayName: 'Payment Cycle',
      required: false,
      description: 'Payment cycle for Subscription products. Defaults to Monthly.',
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
            label: 'LifeTime',
            value: 'LifeTime',
          },
          {
            label: 'OneTime',
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
      displayName: 'Subscription fee',
      description: 'Fee per cycle. Required for Subscription products.',
      required: false,
    }),
    cycles: Property.Number({
      displayName: 'No of cycles',
      required: false,
      description: 'Number of billing cycles (Subscription products). Leave empty for no limit.',
    }),
    signupFee: Property.Number({
      displayName: 'Signup fee',
      required: false,
      description: 'One-time signup fee (Subscription products).',
    }),
    customPeriodType: Property.StaticDropdown({
      displayName: 'Custom Period Type',
      required: false,
      description: 'Period type when the Payment Cycle is Custom.',
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
      displayName: 'Custom No of Period',
      required: false,
      description: 'Number of periods when the Payment Cycle is Custom or OneTime.',
    }),
    trialDayCount: Property.Number({
      displayName: 'Trial Days',
      required: false,
      description: 'Free trial length in days (Subscription products).',
    }),
    gracePeriodDayCount: Property.Number({
      displayName: 'Grace Period Count',
      description: 'Grace period in days after a missed payment (Subscription products).',
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
