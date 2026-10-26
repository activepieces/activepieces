import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooConfirmSaleOrder = createAction({
  auth: odooAuth,
  name: 'odoo_confirm_sale_order',
  classification: 'WRITE',
  displayName: 'Confirm Quotation',
  description: 'Confirm an Odoo quotation into a sales order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Confirms one Odoo quotation into a sales order (action_confirm), which can create deliveries and lock pricing. Only draft or sent quotations can be confirmed. Needs the Sales app. Not idempotent: a second call fails because the order is no longer a quotation.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.saleOrder,
  props: {
    order_id: atomicProps.idProp({ displayName: 'Order ID', description: 'sale.order ID.' }),
  },
  async run(context) {
    const id = odooInput.toId({ value: context.propsValue.order_id, label: 'Order ID' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    await client.callAllowNone({ model: odooApps.saleOrder.model, method: 'action_confirm', args: [[id]] });
    return odooRecords.readApp({ client, model: odooApps.saleOrder.model, id, wanted: odooApps.saleOrder.fields, manyToOne: odooApps.saleOrder.manyToOne });
  },
});
