import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const findCustomer = createAction({
  auth: mailchimpAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Find a customer by email address in a store',
  props: {
    store_id: mailchimpCommon.mailChimpStoreIdDropdown,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to search for',
      required: true,
    }),
    fields: Property.LongText({
      displayName: 'Include Fields',
      description: 'Comma-separated list of fields to return',
      required: false,
    }),
    exclude_fields: Property.LongText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated list of fields to exclude',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of records to return (max 1000)',
      required: false,
      defaultValue: 10,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip for pagination',
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
