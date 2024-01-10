import { Property } from '@activepieces/pieces-framework';
import { flowluCommon } from '.';

export const flowluProps = {
  account: {
    owner_id: flowluCommon.user_id(false, 'Assignee ID'),
    account_category_id: flowluCommon.account_category_id(false),
    industry_id: flowluCommon.industry_id(false),
    web: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Primary Phone Number',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    vat: Property.ShortText({
      displayName: 'VAT or TAX ID',
      required: false,
    }),
    bank_details: Property.LongText({
      displayName: 'Bank Details',
      required: false,
    }),
    telegram: Property.ShortText({
      displayName: 'Telegram',
      required: false,
    }),
    skype: Property.ShortText({
      displayName: 'Skype Account ID',
      required: false,
    }),
    link_google: Property.ShortText({
      displayName: 'Link to Google+',
      required: false,
    }),
    link_facebook: Property.ShortText({
      displayName: 'Link to Facebook',
      required: false,
    }),
    link_linkedin: Property.ShortText({
      displayName: 'Link to Linkedin',
      required: false,
    }),
    link_instagram: Property.ShortText({
      displayName: 'Link to Instagram',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Billing Country',
      required: false,
    }),
    billing_state: Property.ShortText({
      displayName: 'Billing State',
      required: false,
    }),
    billing_city: Property.ShortText({
      displayName: 'Billing City',
      required: false,
    }),
    billing_zip: Property.ShortText({
      displayName: 'Billing Postal code',
      required: false,
    }),
    billing_address_line_1: Property.ShortText({
      displayName: 'Billing Address Line 1',
      required: false,
    }),
    billing_address_line_2: Property.ShortText({
      displayName: 'Billing Address Line 2',
      required: false,
    }),
    billing_address_line_3: Property.ShortText({
      displayName: 'Billing Address Line 3',
      required: false,
    }),
    shipping_country: Property.ShortText({
      displayName: 'Shipping Country',
      required: false,
    }),
    shipping_state: Property.ShortText({
      displayName: 'Shipping State',
      required: false,
    }),
    shipping_city: Property.ShortText({
      displayName: 'Shipping City',
      required: false,
    }),
    shipping_zip: Property.ShortText({
      displayName: 'Shipping Postal code',
      required: false,
    }),
    shipping_address_line_1: Property.ShortText({
      displayName: 'Shipping Address Line 1',
      required: false,
    }),
    shipping_address_line_2: Property.ShortText({
      displayName: 'Shipping Address Line 2',
      required: false,
    }),
    shipping_address_line_3: Property.ShortText({
      displayName: 'Shipping Address Line 3',
      required: false,
    }),
  },
  opportunity: {
    name: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    budget: Property.Number({
      displayName: 'Opportunity Amount',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    source_id: flowluCommon.source_id(false),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    deadline: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
    assignee_id: flowluCommon.user_id(false, 'Assignee ID'),
  },
};
