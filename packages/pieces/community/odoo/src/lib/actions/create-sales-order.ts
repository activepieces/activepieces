import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooDates, odooInput } from '../common/values';
import { saleOrderOutputSchema } from '../output-schemas';

export const createSalesOrderAction = createAction({
  auth: odooAuth,
  name: 'create_sales_order',
  classification: 'WRITE',
  displayName: 'Create Quotation',
  description: 'Create a quotation (draft sales order) with order lines.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a draft Odoo quotation (sale.order) for a customer with one or more product lines; confirm it afterwards with action_confirm. Needs the Sales app. Not idempotent: each call creates a new quotation.',
    idempotent: false,
  },
  outputSchema: saleOrderOutputSchema,
  props: {
    partner_id: odooProps.fixedModelDropdown({
      model: 'res.partner',
      displayName: 'Customer',
      description: 'The contact or company the quotation is for.',
      required: true,
    }),
    lines: Property.Array({
      displayName: 'Order Lines',
      required: true,
      properties: {
        product: Property.ShortText({
          displayName: 'Product',
          description: 'Product variant ID, or its Internal Reference (for example FURN_7800).',
          required: true,
        }),
        quantity: Property.Number({ displayName: 'Quantity', description: 'Defaults to 1.', required: false }),
        price_unit: Property.Number({ displayName: 'Unit Price', description: 'Leave empty to use the product price.', required: false }),
        description: Property.ShortText({ displayName: 'Description', description: 'Leave empty to use the product name.', required: false }),
      },
    }),
    client_order_ref: Property.ShortText({ displayName: 'Customer Reference', required: false }),
    validity_date: Property.DateTime({ displayName: 'Expiration Date', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const partnerId = odooInput.toId({ value: p.partner_id, label: 'Customer' });
    const lines = odooInput.parseArray({ value: p.lines, label: 'Order Lines' }).map((line, index) => {
      if (!odooInput.isRecord(line)) throw new Error(`Order Lines: line ${index + 1} must be an object with a product, for example {"product": "FURN_7800", "quantity": 2}.`);
      return {
        product: line['product'],
        quantity: line['quantity'],
        price_unit: line['price_unit'],
        description: line['description'],
      };
    });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.createSaleOrder({
      client,
      partnerId,
      lines,
      values: odooInput.definedOnly({
        client_order_ref: odooInput.optionalText(p.client_order_ref),
        validity_date: odooDates.inputToOdooDate({ value: p.validity_date, label: 'Expiration Date' }),
      }),
    });
  },
});
