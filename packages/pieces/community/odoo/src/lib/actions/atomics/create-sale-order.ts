import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooDates, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooCreateSaleOrder = createAction({
  auth: odooAuth,
  name: 'odoo_create_sale_order',
  classification: 'WRITE',
  displayName: 'Create Quotation',
  description: 'Create a draft sales order (quotation) in Odoo.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a draft Odoo quotation (sale.order) for a customer with product lines (product ID or internal reference, quantity, optional unit price and description); prices and taxes come from Odoo when omitted. Confirm it with odoo_confirm_sale_order. Needs the Sales app. Not idempotent: each call creates a new quotation. If read_back_error is set, the record was created but could not be read back: do not create it again; read it with odoo_get_records using the returned id.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.createdSaleOrder,
  props: {
    partner_id: atomicProps.idProp({ displayName: 'Customer ID', description: 'res.partner ID from odoo_find_partners.' }),
    lines: Property.Json({
      displayName: 'Lines',
      description:
        'JSON list of lines, for example [{"product": 12, "quantity": 2}, {"product": "FURN_7800", "quantity": 1, "price_unit": 99.5, "description": "Custom desk"}]. product = product.product ID or internal reference.',
      required: true,
    }),
    client_order_ref: atomicProps.textProp({ displayName: 'Customer Reference', description: 'For example the customer PO number.' }),
    validity_date: atomicProps.textProp({ displayName: 'Expiration Date', description: 'Date, for example 2026-10-31.' }),
    user_id: atomicProps.optionalIdProp({ displayName: 'Salesperson User ID', description: 'res.users ID. Omit for the connected user.' }),
  },
  async run(context) {
    const p = context.propsValue;
    const lines = odooInput.parseArray({ value: p.lines, label: 'Lines' }).map((line, index) => {
      if (!odooInput.isRecord(line)) throw new Error(`Line ${index + 1} must be an object with a product.`);
      return { product: line['product'], quantity: line['quantity'], price_unit: line['price_unit'], description: line['description'] };
    });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.createSaleOrder({
      client,
      partnerId: odooInput.toId({ value: p.partner_id, label: 'Customer ID' }),
      lines,
      values: odooInput.definedOnly({
        client_order_ref: odooInput.optionalText(p.client_order_ref),
        validity_date: odooDates.inputToOdooDate({ value: p.validity_date, label: 'Expiration Date' }),
        user_id: odooInput.optionalId({ value: p.user_id, label: 'Salesperson User ID' }),
      }),
    });
  },
});
