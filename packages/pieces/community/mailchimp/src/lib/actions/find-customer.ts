import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findCustomer = createAction({
  auth: mailchimpAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Find detailed information about a specific customer from a Mailchimp e-commerce store including order history, contact details, and address information',
  props: {
    store_id: Property.ShortText({
      displayName: 'Store ID',
      description: 'The unique ID of the e-commerce store where the customer exists',
      required: true,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The unique ID of the customer to find',
      required: true,
    }),
    fields: Property.Array({
      displayName: 'Include Fields',
      description: 'A comma-separated list of fields to return. Reference parameters of sub-objects with dot notation (e.g., "address.city", "address.country")',
      required: false,
    }),
    exclude_fields: Property.Array({
      displayName: 'Exclude Fields',
      description: 'A comma-separated list of fields to exclude. Reference parameters of sub-objects with dot notation',
      required: false,
    }),
  },
  async run(context) {
    const access_token = context.auth.access_token;
    const mailChimpServerPrefix = await mailchimpCommon.getMailChimpServerPrefix(access_token);
    
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    try {
      const options: any = {};
      
      if (context.propsValue.fields && context.propsValue.fields.length > 0) {
        options.fields = context.propsValue.fields.join(',');
      }
      
      if (context.propsValue.exclude_fields && context.propsValue.exclude_fields.length > 0) {
        options.exclude_fields = context.propsValue.exclude_fields.join(',');
      }

      const customer = await (mailchimp as any).ecommerce.getStoreCustomer(
        context.propsValue.store_id,
        context.propsValue.customer_id,
        options
      );

      return {
        success: true,
        found: true,
        customer: {
          id: customer.id,
          email_address: customer.email_address,
          sms_phone_number: customer.sms_phone_number,
          opt_in_status: customer.opt_in_status,
          company: customer.company,
          first_name: customer.first_name,
          last_name: customer.last_name,
          orders_count: customer.orders_count,
          total_spent: customer.total_spent,
          address: customer.address,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          _links: customer._links,
        },
        customer_summary: {
          full_name: customer.first_name && customer.last_name ? 
            `${customer.first_name} ${customer.last_name}` : 
            customer.first_name || customer.last_name || 'N/A',
          email: customer.email_address,
          company: customer.company || 'N/A',
          phone: customer.sms_phone_number || 'N/A',
          location: customer.address ? {
            city: customer.address.city,
            state: customer.address.province,
            state_code: customer.address.province_code,
            country: customer.address.country,
            country_code: customer.address.country_code,
            postal_code: customer.address.postal_code,
          } : null,
        },
        order_information: {
          total_orders: customer.orders_count || 0,
          total_spent: customer.total_spent || 0,
          average_order_value: customer.orders_count > 0 ? 
            (customer.total_spent / customer.orders_count) : 0,
        },
        contact_details: {
          email: customer.email_address,
          sms_phone: customer.sms_phone_number,
          opt_in_status: customer.opt_in_status,
          marketing_consent: customer.opt_in_status ? 'Opted In' : 'Not Opted In',
        },
        address_details: customer.address ? {
          street_address: {
            primary: customer.address.address1,
            secondary: customer.address.address2,
          },
          city: customer.address.city,
          state_province: {
            name: customer.address.province,
            code: customer.address.province_code,
          },
          postal_code: customer.address.postal_code,
          country: {
            name: customer.address.country,
            code: customer.address.country_code,
          },
          full_address: [
            customer.address.address1,
            customer.address.address2,
            customer.address.city,
            customer.address.province,
            customer.address.postal_code,
            customer.address.country,
          ].filter(Boolean).join(', '),
        } : null,
        account_information: {
          customer_id: customer.id,
          created_date: customer.created_at,
          last_updated: customer.updated_at,
          member_since: customer.created_at ? 
            new Date(customer.created_at).toLocaleDateString() : 'N/A',
          days_since_created: customer.created_at ? 
            Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        },
        raw_data: customer,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          found: false,
          error: 'Customer not found',
          message: `The customer with ID "${context.propsValue.customer_id}" could not be found in store "${context.propsValue.store_id}". Make sure both the store ID and customer ID are correct.`,
          detail: error.detail || 'The requested resource could not be found',
          suggestions: [
            'Verify the store ID is correct and exists in your Mailchimp account',
            'Check that the customer ID is valid and belongs to the specified store',
            'Ensure the customer has not been deleted or archived',
            'Confirm you have access to both the store and customer data',
          ],
        };
      }
      
      if (error.status === 400) {
        return {
          success: false,
          error: 'Invalid request',
          message: 'The request to find the customer was invalid. This could be due to malformed data or invalid parameters.',
          detail: error.detail || 'Bad request',
          suggestions: [
            'Verify the store ID format is correct',
            'Check that the customer ID format is valid',
            'Ensure all required parameters are provided',
            'Validate the field names in include/exclude fields',
          ],
        };
      }
      
      if (error.status === 403) {
        return {
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this customer information. Check your API key permissions.',
          detail: error.detail || 'Forbidden',
          suggestions: [
            'Verify your API key has the necessary permissions',
            'Check that you have access to the specified store',
            'Ensure your account is active and in good standing',
            'Confirm you have e-commerce data access enabled',
          ],
        };
      }
      
      throw new Error(`Failed to find customer: ${error.message || JSON.stringify(error)}`);
    }
  },
});
