import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient, OdooFieldMap } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicSchemas } from './output-schemas';

function typeValues({ kind, fields }: { kind: string; fields: OdooFieldMap }): Record<string, unknown> {
  if (kind === 'service') {
    return 'detailed_type' in fields && !('is_storable' in fields) ? { detailed_type: 'service' } : { type: 'service' };
  }
  if ('is_storable' in fields) {
    return kind === 'storable' ? { type: 'consu', is_storable: true } : { type: 'consu' };
  }
  const detailed = fields['detailed_type'];
  if (detailed) {
    if (kind !== 'storable') return { detailed_type: 'consu' };
    const options = Array.isArray(detailed.selection) ? detailed.selection.map(([value]) => value) : [];
    if (options.includes('product')) return { detailed_type: 'product' };
    throw new Error('Tracked-inventory products need the Inventory app installed in Odoo.');
  }
  if (kind === 'storable') throw new Error('Tracked-inventory products need the Inventory app installed in Odoo.');
  return { type: 'consu' };
}

async function variantOf({ client, templateId }: { client: OdooClient; templateId: number }): Promise<number> {
  const [template] = await client.call<{ product_variant_id?: unknown }[]>({
    model: 'product.template',
    method: 'read',
    args: [[templateId]],
    kwargs: { fields: ['product_variant_id'] },
  });
  const variant = template?.product_variant_id;
  if (Array.isArray(variant) && typeof variant[0] === 'number') return variant[0];
  throw new Error('it has no product variant');
}

export const odooCreateProduct = createAction({
  auth: odooAuth,
  name: 'odoo_create_product',
  classification: 'WRITE',
  displayName: 'Create Product',
  description: 'Create a product in Odoo.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Odoo product (product.template) of kind goods (default), service or storable (inventory-tracked, needs the Inventory app), with sales price, cost, internal reference and barcode; maps the kind to the right fields for Odoo 16-17 or 18+. Returns the product variant ID used on order and invoice lines. Not idempotent: each call creates a new product.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.product,
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Product name.', required: true }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'goods (default), service, or storable (inventory-tracked goods).',
      required: false,
      options: { options: [{ label: 'Goods', value: 'goods' }, { label: 'Service', value: 'service' }, { label: 'Storable goods', value: 'storable' }] },
    }),
    list_price: Property.Number({ displayName: 'Sales Price', description: 'Unit sales price.', required: false }),
    standard_price: Property.Number({ displayName: 'Cost', description: 'Unit cost.', required: false }),
    default_code: Property.ShortText({ displayName: 'Internal Reference', description: 'For example FURN_7800.', required: false }),
    barcode: Property.ShortText({ displayName: 'Barcode', description: 'Must be unique in Odoo.', required: false }),
    sale_ok: Property.Checkbox({ displayName: 'Can Be Sold', description: 'Default true in Odoo.', required: false }),
    purchase_ok: Property.Checkbox({ displayName: 'Can Be Purchased', description: 'Default true in Odoo.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const kind = p.kind === 'service' || p.kind === 'storable' ? p.kind : 'goods';
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const fields = await client.fieldsGet('product.template');
    const values = odooInput.definedOnly({
      name: p.name,
      ...typeValues({ kind, fields }),
      list_price: odooInput.toOptionalNumber({ value: p.list_price, label: 'Sales Price' }),
      standard_price: odooInput.toOptionalNumber({ value: p.standard_price, label: 'Cost' }),
      default_code: odooInput.optionalText(p.default_code),
      barcode: odooInput.optionalText(p.barcode),
      sale_ok: typeof p.sale_ok === 'boolean' ? p.sale_ok : undefined,
      purchase_ok: typeof p.purchase_ok === 'boolean' ? p.purchase_ok : undefined,
    });
    const templateId = await client.call<number>({ model: 'product.template', method: 'create', args: [values] });
    try {
      const variantId = await variantOf({ client, templateId });
      return await odooRecords.readApp({ client, model: odooApps.product.model, id: variantId, wanted: odooApps.product.fields, manyToOne: odooApps.product.manyToOne });
    } catch (error) {
      throw odooRecords.createdButUnread({ label: 'Product template', model: 'product.template', id: templateId, error });
    }
  },
});
