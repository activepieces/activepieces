import {
    createAction,
    Property,
  } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

import { invoiceninjaAuth } from '../..';

export const createRecurringInvoice = createAction({
    auth: invoiceninjaAuth,
    name: 'create_recurring_invoice',
    displayName: 'Create Recurring Invoice',
    description: 'Creates a recurring invoice in Invoice Ninja for billing purposes.',
    
    props: {
      client_id: Property.LongText({
        displayName: 'Client ID (alphanumeric)',
        description: 'Client ID from Invoice Ninja',
        required: true,
      }),
      purchase_order_no: Property.LongText({
        displayName: 'Purchase Order Number (alphanumeric)',
        description: 'Descriptive text or arbitrary number (optional)',
        required: false,
      }),
      discount: Property.LongText({
        displayName: 'Apply discount',
        description: 'Enter a number for the whole invoice discount',
        defaultValue: '0',
        required: true,
      }),
      discount_type: Property.StaticDropdown({
        displayName: 'Type of discount',
        description: 'Select either amount or percentage for invoice discount. Applies to line items and invoice.', 
        defaultValue: true,
        required: true,
        options: {
          options: [
            {
              label: 'Amount',
              value: true
            },
            {
              label: 'Percentage',
              value: false
            }
          ]
        }
      }),
      public_notes: Property.LongText({
        displayName: 'Public notes for invoice',
        description: 'Text that may be visible in the client portal (optional)',
        required: false,
      }),
      private_notes: Property.LongText({
        displayName: 'Private notes for invoice',
        description: 'Text not visible for clients (optional)',
        required: false,
      }),
      order_items_json: Property.LongText({
        displayName: 'Order Items JSON string',
        description: 'e.g., [{ "quantity":1,"product_key":"product key", "discount": "0" }]',
        required: true,
      }),
      frequency: Property.StaticDropdown({
        displayName: 'Frequency of billing',
        description: 'Choose one',
        defaultValue: 5,
        required: true,
        options: {
          options: [
            {
                label: 'Use override below',
                value:0,
            },
            {
              label: 'Daily',
              value: 1
            },
            {
              label: 'Weekly',
              value: 2
            },
            {
                label: '2 Weeks',
                value: 3
              },
              {
                label: '4 Weeks',
                value: 4
              },
              {
                label: 'Monthly',
                value: 5
              },
              {
                label: 'Two Months',
                value: 6
              },
              {
                label: 'Quarterly',
                value: 7
              },
              {
                label: 'Four Months',
                value: 8
              },
              {
                label: 'Semi Annually',
                value: 9
              },
              {
                label: 'Annually',
                value: 10
              },
              {
                label: 'Two Years',
                value: 11
              },
              {
                label: 'Three Years',
                value: 12
              }
          ]
        },
      }),
      nocycles: Property.Number({
        displayName: 'No of billing cycles',
        description: 'Enter a number. How many times should this bill be generated',
        required: false,
      }),
      auto_frequency: Property.Number({
        displayName: 'Override Frequency using Frequency ID (optional)',
        description: 'Enter a number. 1-12 - corresponds to dropdown above [Daily being 1, Weekly 2 etc..]!',
        required: false,
      }),
      due_date: Property.DateTime({
        displayName: 'Invoice next send date',
        description: 'e.g., 2024-01-20',
        required: true,
      }),
      last_date: Property.DateTime({
        displayName: 'Invoice last sent date',
        description: 'e.g., 2024-01-20',
        required: false,
      }),
    },
  
    async run(context) {
      await propsValidation.validateZod(context.propsValue, {
        nocycles: z.number().min(0).max(999).optional(),
        auto_frequency: z.number().min(1).max(12).optional(),
        due_date: z.string().datetime(),
        last_date: z.string().datetime().optional(),
      });

      const INapiToken = context.auth.access_token;
      const headers = {
        'X-Api-Token': INapiToken,
        'Content-Type': 'application/json',
      };
  
      const lineItemsArray = JSON.parse(context.propsValue.order_items_json);
  
      if (!Array.isArray(lineItemsArray)) {
        throw new Error('Invalid format for order_items_json. It should be an array of objects.');
      }
  
      if (lineItemsArray.length === 0) {
        throw new Error('The line_items array must not be empty.');
      }
  
      const isValidLineItem = lineItemsArray.every(item => (
        typeof item === 'object' &&
        'quantity' in item && typeof item.quantity === 'number' &&
        'product_key' in item && typeof item.product_key === 'string' &&
        'discount' in item && typeof item.discount === 'string'
      ));
  
      if (!isValidLineItem) {
        throw new Error('Each item in the line_items array must be an object with "quantity" (number), "product_key" (string), and "discount" (string).');
      }
  
      const baseUrl = context.auth.base_url.replace(/\/$/, '');
      let errorMessages = '';
  
      try {
        const lineItemsWithDetailsPromises = lineItemsArray.map(async item => {
          try {
            const getProductDetailsResponse = await fetch(`${baseUrl}/api/v1/products/?product_key=${item.product_key}`, {
              method: 'GET',
              headers,
            });
  
            if (!getProductDetailsResponse.ok) {
              console.error(`Failed to get product details for ${item.product_key}. Status: ${getProductDetailsResponse.status}`);
              errorMessages += `Failed to get product details for ${item.product_key}\n`;
              return null;
            }
  
            const productDetailsResponseBody = await getProductDetailsResponse.json();
            const productCount = productDetailsResponseBody.meta.pagination.count;
  
            if (productCount < 1) {
              console.error(`No product details found for ${item.product_key}.`);
              errorMessages += `No product details found for ${item.product_key}\n`;
              return null;
            }
  
            const productDetails = productDetailsResponseBody.data[0];
  
            return {
              quantity: item.quantity,
              product_key: item.product_key,
              product_cost: productDetails.price,
              cost: productDetails.price,
              notes: productDetails.notes,
              discount: item.discount || '0',
              is_amount_discount: context.propsValue.discount_type,
              tax_name1: productDetails.tax_name1,
              tax_rate1: productDetails.tax_rate1,
              tax_id: productDetails.tax_id,
            };
          } catch (error) {
            console.error(`Error getting product details for ${item.product_key}:`, error);
            errorMessages += `Error getting product details for ${item.product_key}: ${error}\n`;
            return null;
          }
        });
  
        const lineItemsWithDetails = await Promise.all(lineItemsWithDetailsPromises);
  
        if (errorMessages) {
          // If there are error messages, throw an error with the accumulated messages
          throw new Error(errorMessages.trim());
        }
  
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
        const createInvoiceRequestBody = {
        //status_id: 2, // seems cant set the status id when creating need another api call either using the recurring invoice ID and updating the status that way
        // or possibly calling /bulk with action=start there's also an action send_now
          next_send_date: context.propsValue.due_date,
          date: formattedDate,
          client_id: context.propsValue.client_id || '',
          po_number: context.propsValue.purchase_order_no || '',
          public_notes: context.propsValue.public_notes || '',
          private_notes: context.propsValue.private_notes || '',
          line_items: lineItemsWithDetails,
          discount: context.propsValue.discount,
          is_amount_discount: context.propsValue.discount_type,
          frequency_id: context.propsValue.auto_frequency || context.propsValue.frequency,
          remaining_cycles:context.propsValue.nocycles || -1,
        };
  // if remaining cycles is set to 0 it will automatically go completed -1 is endless!
  // status_id 2 is pending ie start scheduling
        const createInvoiceResponse = await fetch(`${baseUrl}/api/v1/recurring_invoices`, {
          method: 'POST',
          headers,
          body: JSON.stringify(createInvoiceRequestBody),
        });
  
        if (!createInvoiceResponse.ok) {
          throw new Error(`Failed to create recurring invoice. Status: ${createInvoiceResponse.status}`);
        }
  
        const createInvoiceResponseBody = await createInvoiceResponse.json();
  
        return createInvoiceResponseBody;
      } catch (error) {
        console.error('Error creating recurring invoice or getting product details:', error);
        if (errorMessages) {
          // If there are error messages, throw an error with the accumulated messages
          throw new Error(errorMessages.trim());
        } else {
          // If there are no error messages, throw the original error
          throw error;
        }
      }  
    },
  });