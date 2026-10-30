import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooCountRecords = createAction({
  auth: odooAuth,
  name: 'odoo_count_records',
  classification: 'SEARCH',
  displayName: 'Count Records',
  description: 'Count the records of an Odoo model that match a domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts records of any Odoo model matching an Odoo domain (search_count) without reading them. Use for totals, since search results are paged. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.count,
  props: {
    model: atomicProps.modelProp(),
    domain: atomicProps.domainProp(),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const domain = odooDomain.parseDomain({ value: context.propsValue.domain });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const count = await client.call<number>({ model, method: 'search_count', args: [domain] });
    return { model, count };
  },
});
