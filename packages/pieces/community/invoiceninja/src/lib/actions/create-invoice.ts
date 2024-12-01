import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

import { invoiceninjaAuth } from '../..';

export const createInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Creates an invoice in Invoice Ninja for billing purposes.',
  
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
    send_email: Property.Checkbox({
      displayName: 'Send invoice to the client by InvoiceNinja e-mail?',
      description: 'Should we send the invoice to the client on creation?',
      defaultValue: false,
      required: true,
    }),
    mark_sent: Property.Checkbox({
      displayName: 'Mark the invoice as sent?',
      description: 'Makes the invoice active otherwise remains pending.',
      defaultValue: false,
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: 'Invoice due date',
      description: 'e.g., 2024-01-20',
      required: false,
    }),
  },

  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      due_date: z.string().datetime().optional(),
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
        due_date: context.propsValue.due_date,
        date: formattedDate,
        client_id: context.propsValue.client_id || '',
        po_number: context.propsValue.purchase_order_no || '',
        public_notes: context.propsValue.public_notes || '',
        private_notes: context.propsValue.private_notes || '',
        line_items: lineItemsWithDetails,
        discount: context.propsValue.discount,
        is_amount_discount: context.propsValue.discount_type,
        send_email: context.propsValue.send_email,
        mark_sent: context.propsValue.mark_sent,
      };

      const createInvoiceResponse = await fetch(`${baseUrl}/api/v1/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(createInvoiceRequestBody),
      });

      if (!createInvoiceResponse.ok) {
        throw new Error(`Failed to create invoice. Status: ${createInvoiceResponse.status}`);
      }

      const createInvoiceResponseBody = await createInvoiceResponse.json();

      return createInvoiceResponseBody;
    } catch (error) {
      console.error('Error creating invoice or getting product details:', error);
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
