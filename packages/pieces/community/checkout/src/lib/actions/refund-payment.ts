import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const refundPaymentAction = createAction({
  name: 'refund_payment',
  auth: checkoutComAuth,
  displayName: 'Refund a Payment',
  description: 'Issue a refund (full or partial) for a captured payment. Supports split refunds, line items, and bank account destinations.',
  props: {
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'A reference, such as an order ID, that can be used to identify the payment',
      required: true,
    }),
    payment_id: Property.Dropdown({
      displayName: 'Payment ID',
      description: 'Select the payment to refund',
      required: true,
      refreshers: ['reference'],
      options: async ({ auth, reference }) => {
        if (!reference) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter a reference first',
          };
        }

        try {
          const { baseUrl } = getEnvironmentFromApiKey(auth as string);
          
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/payments`,
            queryParams: {
              reference: reference as string,
              limit: '100',
            },
            headers: {
              Authorization: `Bearer ${auth}`,
              'Content-Type': 'application/json',
            },
          });

          const payments = response.body.data || [];
          
          const refundablePayments = payments.filter((payment: any) => 
            payment.status === 'Captured' || payment.status === 'Authorized'
          );
          
          if (refundablePayments.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No refundable payments found for this reference',
            };
          }

          return {
            disabled: false,
            options: refundablePayments.map((payment: any) => ({
              label: `${payment.id} - ${payment.amount} ${payment.currency} (${payment.status})`,
              value: payment.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading payments',
          };
        }
      },
    }),
    amount: Property.Number({
      displayName: 'Refund Amount',
      description: 'The amount to refund in minor units. If not specified, full payment amount will be refunded.',
      required: false,
    }),
    refund_reference: Property.ShortText({
      displayName: 'Refund Reference',
      description: 'Your reference for the refund (max 80 chars, 30 for Amex, 50 for TWINT)',
      required: false,
    }),
    capture_action_id: Property.ShortText({
      displayName: 'Capture Action ID',
      description: 'The action ID of the capture to refund (only for PayPal and Riverty)',
      required: false,
    }),
    
    amount_allocations: Property.Array({
      displayName: 'Amount Allocations',
      description: 'Split refund allocations for sub-entities',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Sub-entity ID',
          description: 'The ID of the sub-entity',
          required: true,
        }),
        amount: Property.Number({
          displayName: 'Split Amount',
          description: 'The amount to refund to this sub-entity in minor units',
          required: true,
        }),
        reference: Property.ShortText({
          displayName: 'Split Reference',
          description: 'Reference for this split (e.g., order number)',
          required: false,
        }),
        commission_amount: Property.Number({
          displayName: 'Commission Amount',
          description: 'Fixed commission amount in minor units',
          required: false,
        }),
        commission_percentage: Property.Number({
          displayName: 'Commission Percentage',
          description: 'Commission percentage (0-100, supports up to 8 decimal places)',
          required: false,
        }),
      },
    }),
    
    // Line Items for Detailed Refunds
    items: Property.Array({
      displayName: 'Line Items',
      description: 'Order line items for the refund',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Item Type',
          description: 'The item type (e.g., physical, digital)',
          required: false,
        }),
        name: Property.ShortText({
          displayName: 'Item Name',
          description: 'The descriptive name of the line item',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The number of line items',
          required: false,
        }),
        unit_price: Property.Number({
          displayName: 'Unit Price',
          description: 'The unit price in minor currency units',
          required: false,
        }),
        reference: Property.ShortText({
          displayName: 'Item Reference',
          description: 'The item reference or product SKU',
          required: false,
        }),
        total_amount: Property.Number({
          displayName: 'Total Amount',
          description: 'The total cost including tax and discount in minor units',
          required: false,
        }),
        tax_rate: Property.Number({
          displayName: 'Tax Rate',
          description: 'Tax rate in minor units (e.g., 2000 = 20%)',
          required: false,
        }),
        tax_amount: Property.Number({
          displayName: 'Tax Amount',
          description: 'Total tax amount in minor units',
          required: false,
        }),
        discount_amount: Property.Number({
          displayName: 'Discount Amount',
          description: 'Discount applied to the line item',
          required: false,
        }),
        url: Property.ShortText({
          displayName: 'Product URL',
          description: 'Link to the product page',
          required: false,
        }),
        image_url: Property.ShortText({
          displayName: 'Product Image URL',
          description: 'Link to the product image',
          required: false,
        }),
      },
    }),
    
    // Bank Account Destination (Required for giropay and EPS)
    destination_country: Property.ShortText({
      displayName: 'Destination Country',
      description: 'Two-letter ISO country code for bank account (required for giropay/EPS)',
      required: false,
    }),
    destination_account_number: Property.ShortText({
      displayName: 'Account Number',
      description: 'The bank account number',
      required: false,
    }),
    destination_bank_code: Property.ShortText({
      displayName: 'Bank Code',
      description: 'The code that identifies the bank',
      required: false,
    }),
    destination_iban: Property.ShortText({
      displayName: 'IBAN',
      description: 'International Bank Account Number',
      required: false,
    }),
    destination_swift_bic: Property.ShortText({
      displayName: 'SWIFT BIC',
      description: '8 or 11-digit code identifying the bank',
      required: false,
    }),
    
    // Account Holder Information
    account_holder_first_name: Property.ShortText({
      displayName: 'Account Holder First Name',
      description: 'The account holder\'s first name',
      required: false,
    }),
    account_holder_last_name: Property.ShortText({
      displayName: 'Account Holder Last Name',
      description: 'The account holder\'s last name',
      required: false,
    }),
    account_holder_type: Property.StaticDropdown({
      displayName: 'Account Holder Type',
      description: 'The type of account holder',
      required: false,
      options: {
        options: [
          { label: 'Individual', value: 'individual' },
          { label: 'Corporate', value: 'corporate' },
          { label: 'Government', value: 'government' },
        ],
      },
    }),
    account_holder_company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name for corporate account holders',
      required: false,
    }),
    account_holder_email: Property.ShortText({
      displayName: 'Account Holder Email',
      description: 'The account holder\'s email address',
      required: false,
    }),
    account_holder_phone_country_code: Property.ShortText({
      displayName: 'Phone Country Code',
      description: 'International country calling code',
      required: false,
    }),
    account_holder_phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The account holder\'s phone number',
      required: false,
    }),
    
    // Account Holder Address
    account_holder_address_line1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'First line of the account holder\'s address',
      required: false,
    }),
    account_holder_address_line2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Second line of the account holder\'s address',
      required: false,
    }),
    account_holder_city: Property.ShortText({
      displayName: 'City',
      description: 'Account holder\'s city',
      required: false,
    }),
    account_holder_state: Property.ShortText({
      displayName: 'State',
      description: 'Account holder\'s state or province',
      required: false,
    }),
    account_holder_zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'Account holder\'s ZIP or postal code',
      required: false,
    }),
    account_holder_country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO country code',
      required: false,
    }),
    
    // Bank Details
    bank_name: Property.ShortText({
      displayName: 'Bank Name',
      description: 'The name of the bank',
      required: false,
    }),
    bank_branch: Property.ShortText({
      displayName: 'Bank Branch',
      description: 'The name of the bank branch',
      required: false,
    }),
    bank_address_line1: Property.ShortText({
      displayName: 'Bank Address Line 1',
      description: 'First line of the bank\'s address',
      required: false,
    }),
    bank_address_line2: Property.ShortText({
      displayName: 'Bank Address Line 2',
      description: 'Second line of the bank\'s address',
      required: false,
    }),
    bank_city: Property.ShortText({
      displayName: 'Bank City',
      description: 'The bank\'s city',
      required: false,
    }),
    bank_country: Property.ShortText({
      displayName: 'Bank Country',
      description: 'Two-letter ISO country code for the bank',
      required: false,
    }),
    
    // Metadata
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional key-value pairs for the refund request',
      required: false,
    }),
  },
  async run(context) {
    const {
      reference,
      payment_id,
      amount,
      refund_reference,
      capture_action_id,
      amount_allocations,
      items,
      destination_country,
      destination_account_number,
      destination_bank_code,
      destination_iban,
      destination_swift_bic,
      account_holder_first_name,
      account_holder_last_name,
      account_holder_type,
      account_holder_company_name,
      account_holder_email,
      account_holder_phone_country_code,
      account_holder_phone_number,
      account_holder_address_line1,
      account_holder_address_line2,
      account_holder_city,
      account_holder_state,
      account_holder_zip,
      account_holder_country,
      bank_name,
      bank_branch,
      bank_address_line1,
      bank_address_line2,
      bank_city,
      bank_country,
      metadata,
    } = context.propsValue;
    
    const { baseUrl } = getEnvironmentFromApiKey(context.auth);
    
    const body: Record<string, any> = {};
    
    if (typeof amount === 'number') {
      body['amount'] = amount;
    }
    if (refund_reference) {
      body['reference'] = refund_reference;
    }
    if (capture_action_id) {
      body['capture_action_id'] = capture_action_id;
    }
    
    if (amount_allocations && amount_allocations.length > 0) {
      body['amount_allocations'] = amount_allocations.map((allocation: any) => {
        const allocationObj: any = {
          id: allocation.id,
          amount: allocation.amount,
        };
        
        if (allocation.reference) {
          allocationObj['reference'] = allocation.reference;
        }
        
        if (allocation.commission_amount || allocation.commission_percentage) {
          allocationObj['commission'] = {};
          if (allocation.commission_amount) {
            allocationObj['commission']['amount'] = allocation.commission_amount;
          }
          if (allocation.commission_percentage) {
            allocationObj['commission']['percentage'] = allocation.commission_percentage;
          }
        }
        
        return allocationObj;
      });
    }
    
    if (items && items.length > 0) {
      body['items'] = items.map((item: any) => {
        const itemObj: any = {};
        
        if (item.type) itemObj['type'] = item.type;
        if (item.name) itemObj['name'] = item.name;
        if (typeof item.quantity === 'number') itemObj['quantity'] = item.quantity;
        if (typeof item.unit_price === 'number') itemObj['unit_price'] = item.unit_price;
        if (item.reference) itemObj['reference'] = item.reference;
        if (typeof item.total_amount === 'number') itemObj['total_amount'] = item.total_amount;
        if (typeof item.tax_rate === 'number') itemObj['tax_rate'] = item.tax_rate;
        if (typeof item.tax_amount === 'number') itemObj['tax_amount'] = item.tax_amount;
        if (typeof item.discount_amount === 'number') itemObj['discount_amount'] = item.discount_amount;
        if (item.url) itemObj['url'] = item.url;
        if (item.image_url) itemObj['image_url'] = item.image_url;
        
        return itemObj;
      });
    }
    
    if (destination_country && destination_account_number && destination_bank_code) {
      body['destination'] = {
        country: destination_country,
        account_number: destination_account_number,
        bank_code: destination_bank_code,
      };
      
      if (destination_iban) {
        body['destination']['iban'] = destination_iban;
      }
      if (destination_swift_bic) {
        body['destination']['swift_bic'] = destination_swift_bic;
      }
      
      if (account_holder_first_name && account_holder_last_name) {
        body['destination']['account_holder'] = {
          first_name: account_holder_first_name,
          last_name: account_holder_last_name,
        };
        
        if (account_holder_type) {
          body['destination']['account_holder']['type'] = account_holder_type;
        }
        if (account_holder_company_name) {
          body['destination']['account_holder']['company_name'] = account_holder_company_name;
        }
        if (account_holder_email) {
          body['destination']['account_holder']['email'] = account_holder_email;
        }
        
        if (account_holder_phone_country_code && account_holder_phone_number) {
          body['destination']['account_holder']['phone'] = {
            country_code: account_holder_phone_country_code,
            number: account_holder_phone_number,
          };
        }
        
        if (account_holder_address_line1 || account_holder_city || account_holder_country) {
          body['destination']['account_holder']['billing_address'] = {};
          if (account_holder_address_line1) body['destination']['account_holder']['billing_address']['address_line1'] = account_holder_address_line1;
          if (account_holder_address_line2) body['destination']['account_holder']['billing_address']['address_line2'] = account_holder_address_line2;
          if (account_holder_city) body['destination']['account_holder']['billing_address']['city'] = account_holder_city;
          if (account_holder_state) body['destination']['account_holder']['billing_address']['state'] = account_holder_state;
          if (account_holder_zip) body['destination']['account_holder']['billing_address']['zip'] = account_holder_zip;
          if (account_holder_country) body['destination']['account_holder']['billing_address']['country'] = account_holder_country;
        }
      }
      
      if (bank_name || bank_branch || bank_address_line1) {
        body['destination']['bank'] = {};
        if (bank_name) body['destination']['bank']['name'] = bank_name;
        if (bank_branch) body['destination']['bank']['branch'] = bank_branch;
        
        if (bank_address_line1 || bank_city || bank_country) {
          body['destination']['bank']['address'] = {};
          if (bank_address_line1) body['destination']['bank']['address']['address_line1'] = bank_address_line1;
          if (bank_address_line2) body['destination']['bank']['address']['address_line2'] = bank_address_line2;
          if (bank_city) body['destination']['bank']['address']['city'] = bank_city;
          if (bank_country) body['destination']['bank']['address']['country'] = bank_country;
        }
      }
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      body['metadata'] = metadata;
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/payments/${payment_id}/refunds`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Refund not allowed for this payment');
      }
      if (error.response?.status === 404) {
        throw new Error('Payment not found');
      }
      if (error.response?.status === 422) {
        throw new Error(`Invalid data: ${error.response.body?.error_codes?.join(', ') || 'Please check your input data'}`);
      }
      throw error;
    }
  },
}); 