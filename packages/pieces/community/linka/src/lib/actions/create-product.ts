import { createAction, Property } from '@activepieces/pieces-framework';
import { linkaAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createProduct = createAction({
  name: 'createProduct',
  displayName: 'Create Product',
  description: 'Creates a new product in the CRM',
  auth: linkaAuth,
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
      description: 'Required for General , Digital and Event Product Type',
      defaultValue: 0,
    }),
    currencyId: Property.StaticDropdown({
      displayName: 'Currency Id',
      required: false,
      defaultValue: 'USD',
      options: {
        disabled: false,
        options: [
          {
            label: 'USD',
            value: 'USD',
          },
          {
            label: 'JPY',
            value: 'JPY',
          },
          {
            label: 'IND',
            value: 'IND',
          },
          {
            label: 'EUR',
            value: 'EUR',
          },
          {
            label: 'GBP',
            value: 'GBP',
          },
          {
            label: 'AUD',
            value: 'AUD',
          },
          {
            label: 'CAD',
            value: 'CAD',
          },
          {
            label: 'CHF',
            value: 'CHF',
          },
          {
            label: 'CNY',
            value: 'CNY',
          },
          {
            label: 'SEK',
            value: 'SEK',
          },
          {
            label: 'NZD',
            value: 'NZD',
          },
        ],
      },
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      required: false,
      description: 'Required for General and Digital Product Type',
      defaultValue: 'Day',
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
      description: 'Required for General and Digital Product Type',
      defaultValue: 'Monthly',
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
      required: false,
      defaultValue: 0,
    }),
    cycles: Property.Number({
      displayName: 'No of cycles',
      required: false,
      description: 'Required for all except LifeTime or OneTime plan',
      defaultValue: 0,
    }),
    signupFee: Property.Number({
      displayName: 'Signup fee',
      required: false,
      description: 'Required for all except LifeTime or OneTime plan',
      defaultValue: 0,
    }),
    customPeriodType: Property.StaticDropdown({
      displayName: 'Custom Period Type',
      required: false,
      description: 'Required for Custom or OneTime Plan',
      defaultValue: 'Days',
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
      description: 'Required for Custom or OneTime Plan',
      defaultValue: 0,
    }),
    trialDayCount: Property.Number({
      displayName: 'Custom No of Period',
      required: false,
      description: 'Required for OneTime plan',
      defaultValue: 0,
    }),
    gracePeriodDayCount: Property.Number({
      displayName: 'Grace Period Count',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const product = {
      code: context.propsValue.code,
      name: context.propsValue.name,
      logoUrl: context.propsValue.logoURL,
      description: context.propsValue.description,
      descriptionHtml: context.propsValue.descriptionHTML,
      groupName: context.propsValue.groupName,
      type: context.propsValue.productType,
      price: context.propsValue.price,
      currencyId: context.propsValue.currencyId,
      unit: context.propsValue.unit,
      productSubscriptionOptions: [
        {
          frequency: context.propsValue.frequency,
          signupFee: context.propsValue.signupFee,
          fee: context.propsValue.fee,
          trialDayCount: context.propsValue.trialDayCount,
          customPeriodCount: context.propsValue.customPeriodCount,
          customPeriodType: context.propsValue.customPeriodType,
          cycles: context.propsValue.cycles,
          gracePeriodDayCount: context.propsValue.gracePeriodDayCount,
        },
      ],
    };

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.base_url}/api/services/CRM/Import/ImportProduct`,
      headers: {
        'api-key': context.auth.api_key, // Pass API key in headers
        'Content-Type': 'application/json',
      },
      body: {
        ...product,
      },
    });

    return {
      status: res.status,
      body: res.body,
    };
  },
});
