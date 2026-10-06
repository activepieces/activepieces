import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Condition, Domain, odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooFindPartners = createAction({
  auth: odooAuth,
  name: 'odoo_find_partners',
  classification: 'SEARCH',
  displayName: 'Find Contacts',
  description: 'Search Odoo contacts and companies.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Odoo contacts and companies (res.partner) by free text (name, email, phone, reference), exact email, person-or-company, parent company and country code, with offset paging. Use to get a partner ID before creating leads, orders or invoices. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.partners,
  props: {
    query: atomicProps.textProp({ displayName: 'Search Text', description: 'Matches name, email, phone or internal reference (contains, any case).' }),
    email: atomicProps.textProp({ displayName: 'Email (exact)', description: 'Exact email address, any case.' }),
    is_company: Property.Checkbox({ displayName: 'Companies Only', description: 'true = only companies, false = only people. Omit for both.', required: false }),
    parent_id: atomicProps.optionalIdProp({ displayName: 'Parent Company ID', description: 'Only contacts that belong to this company.' }),
    country_code: atomicProps.textProp({ displayName: 'Country Code', description: 'Two-letter ISO code, for example US or BE.' }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', description: 'Also return archived contacts.', required: false }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const map = await client.fieldsGet(odooApps.partner.model);
    const query = odooInput.optionalText(p.query);
    const textFields = ['name', 'email', 'phone', 'mobile', 'ref'].filter((name) => name in map);
    const search: Domain = query ? odooDomain.orConditions(textFields.map((name): Condition => [name, 'ilike', query])) : [];
    const filters: Condition[] = [];
    const email = odooInput.optionalText(p.email);
    if (email) filters.push(['email', '=ilike', email.trim()]);
    if (p.is_company !== undefined && p.is_company !== null) filters.push(['is_company', '=', p.is_company]);
    const parentId = odooInput.optionalId({ value: p.parent_id, label: 'Parent Company ID' });
    if (parentId) filters.push(['parent_id', '=', parentId]);
    const country = odooInput.optionalText(p.country_code);
    if (country) filters.push(['country_id.code', '=', country.trim().toUpperCase()]);
    if (p.include_archived) filters.push(['active', 'in', [true, false]]);
    return odooRecords.findApp({
      client,
      model: odooApps.partner.model,
      wanted: odooApps.partner.fields,
      manyToOne: odooApps.partner.manyToOne,
      domain: odooDomain.andDomains([filters, search]),
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'name asc, id asc',
    });
  },
});
