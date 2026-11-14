import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const findCustomer = createAction({
  auth: mailchimpAuth,
  name: 'find_customer',
  classification: 'SEARCH',
  displayName: 'Find Customer',
  description: 'Find a customer by email address in a store',
  audience: 'both',
  aiMetadata: { description: 'Looks up e-commerce customers in a specified connected store by email address, with optional pagination and field filtering. Use to retrieve a store customer record before referencing or syncing it. Requires a store and email; read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'customer',
      display: 'section',
      label: 'Customer',
      icon: 'user',
      props: ['store_id', 'email_address'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'filter',
      props: ['count', 'offset'],
    },
  ],
  props: {
    store_id: mailchimpCommon.mailChimpStoreIdDropdown,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      placeholder: 'jane@example.com',
      required: true,
    }),
    fields: Property.LongText({
      displayName: 'Include Fields',
      description: 'Comma-separated, in dot notation. Empty returns every field.',
      placeholder: 'customers.email_address',
      required: false,
      advanced: true,
    }),
    exclude_fields: Property.LongText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated, in dot notation.',
      placeholder: '_links',
      required: false,
      advanced: true,
    }),
    count: Property.Number({
      displayName: 'Max Results',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      required: false,
      defaultValue: 10,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of customers to skip, for paging.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
    
    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      const options: any = {
        email_address: context.propsValue.email_address,
        count: context.propsValue.count || 10,
        offset: context.propsValue.offset || 0,
      };
      
      if (context.propsValue.fields) {
        options.fields = context.propsValue.fields.split(',').map(f => f.trim());
      }
      
      if (context.propsValue.exclude_fields) {
        options.exclude_fields = context.propsValue.exclude_fields.split(',').map(f => f.trim());
      }

      const result = await client.ecommerce.getAllStoreCustomers(
        context.propsValue.store_id!,
        options
      );

      return {
        success: true,
        store_id: result.store_id,
        customers: result.customers,
        total_items: result.total_items,
        search_email: context.propsValue.email_address,
        found_customers: result.customers.length,
        _links: result._links,
      };
    } catch (error: any) {
      throw new Error(`Failed to find customer: ${error.message || JSON.stringify(error)}`);
    }
  },
});
