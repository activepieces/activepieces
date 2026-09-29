import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooNameSearch = createAction({
  auth: odooAuth,
  name: 'odoo_name_search',
  classification: 'SEARCH',
  displayName: 'Find ID by Name',
  description: 'Find record IDs by name, like typing in an Odoo selection field.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resolves a name to record IDs the way Odoo selection fields do (name_search), for example a customer, product, stage, user, country or tag name to the ID needed in create or update values. Returns id and name pairs, best matches first. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.nameSearch,
  props: {
    model: atomicProps.modelProp(),
    name: Property.ShortText({ displayName: 'Name', description: 'Text to match, for example "Acme". Empty = first records.', required: false }),
    domain: atomicProps.domainProp(),
    operator: Property.StaticDropdown({
      displayName: 'Match',
      description: 'ilike = contains (default), = = exact name.',
      required: false,
      options: { options: [{ label: 'Contains', value: 'ilike' }, { label: 'Exact', value: '=' }, { label: 'Exact, any case', value: '=ilike' }] },
    }),
    limit: atomicProps.limitProp({ fallback: 10, max: 100 }),
  },
  async run(context) {
    const p = context.propsValue;
    const model = odooInput.toModelName(p.model);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const rows = await client.call<[number, string][]>({
      model,
      method: 'name_search',
      args: [p.name ?? '', odooDomain.parseDomain({ value: p.domain }), p.operator ?? 'ilike', odooInput.clampLimit({ value: p.limit, fallback: 10, max: 100 })],
    });
    const results = rows.map(([id, name]) => ({ id, name }));
    return { model, count: results.length, results };
  },
});
