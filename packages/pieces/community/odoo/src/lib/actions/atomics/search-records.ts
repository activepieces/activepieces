import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooSearchRecords = createAction({
  auth: odooAuth,
  name: 'odoo_search_records',
  classification: 'SEARCH',
  displayName: 'Search Records',
  description: 'Search any Odoo model with a domain and return the chosen fields.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches records of any Odoo model with an Odoo domain and returns the chosen fields (search_read), with sort order and offset paging (has_more / next_offset). Many2one values come back as field (id) plus field_name. Prefer the app-specific find actions (partners, leads, orders, invoices, products, tasks) when they fit. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.genericPage,
  props: {
    model: atomicProps.modelProp(),
    domain: atomicProps.domainProp(),
    fields: atomicProps.fieldsProp(),
    order: Property.ShortText({
      displayName: 'Order',
      description: 'Sort, for example "create_date desc, id desc". Empty = the model default order.',
      required: false,
    }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const model = odooInput.toModelName(p.model);
    const domain = odooDomain.parseDomain({ value: p.domain });
    const limit = odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 });
    const offset = odooInput.toOffset(p.offset);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const { names, map } = await odooRecords.resolveFields({ client, model, fields: odooInput.toStringList(p.fields) });
    const fields = names.includes('display_name') || !('display_name' in map) ? names : [...names, 'display_name'];
    const page = await odooRecords.searchPage({ client, model, domain, fields, map, limit, offset, order: odooInput.optionalText(p.order) });
    return { model, count: page.records.length, offset, limit, has_more: page.has_more, next_offset: page.next_offset, records: page.records };
  },
});
