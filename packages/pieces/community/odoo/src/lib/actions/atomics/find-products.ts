import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Condition, Domain, odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooFindProducts = createAction({
  auth: odooAuth,
  name: 'odoo_find_products',
  classification: 'SEARCH',
  displayName: 'Find Products',
  description: 'Search Odoo products.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Odoo product variants (product.product) by name, internal reference or barcode, optionally only sellable ones, with offset paging. Returns the variant IDs that sales order and invoice lines need. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.products,
  props: {
    query: atomicProps.textProp({ displayName: 'Search Text', description: 'Matches name, internal reference or barcode (contains).' }),
    sale_ok: Property.Checkbox({ displayName: 'Sellable Only', description: 'Only products that can be sold.', required: false }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = odooInput.optionalText(p.query);
    const search: Domain = query ? odooDomain.orConditions(['name', 'default_code', 'barcode'].map((f): Condition => [f, 'ilike', query])) : [];
    const filters: Condition[] = p.sale_ok ? [['sale_ok', '=', true]] : [];
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooRecords.findApp({
      client,
      model: odooApps.product.model,
      wanted: odooApps.product.fields,
      manyToOne: odooApps.product.manyToOne,
      domain: odooDomain.andDomains([filters, search]),
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'default_code asc, name asc, id asc',
    });
  },
});
