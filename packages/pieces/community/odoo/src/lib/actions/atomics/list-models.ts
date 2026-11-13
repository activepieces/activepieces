import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient, odooRpc } from '../../common/client';
import { Domain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooListModels = createAction({
  auth: odooAuth,
  name: 'odoo_list_models',
  classification: 'SEARCH',
  displayName: 'List Models',
  description: 'Find the technical name of an Odoo model, for example "invoice" → account.move.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the Odoo model registry (ir.model) by technical name or description, for example "invoice" finds account.move, to learn which model to pass to the generic record actions. Returns one page sorted by technical name; when has_more is true, call again with offset = next_offset to get the rest. Needs an Odoo user with Administration / Access Rights; other users get an error and should call odoo_get_model_fields with a known model name instead. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.listModels,
  props: {
    query: atomicProps.textProp({
      displayName: 'Search',
      description: 'Part of the model name or description, for example "lead", "invoice" or "sale". Empty = all models.',
    }),
    limit: atomicProps.limitProp({ fallback: 100, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const query = odooInput.optionalText(context.propsValue.query);
    const domain: Domain = query
      ? ['&', ['transient', '=', false], '|', ['model', 'ilike', query], ['name', 'ilike', query]]
      : [['transient', '=', false]];
    const limit = odooInput.clampLimit({ value: context.propsValue.limit, fallback: 100, max: 500 });
    const offset = odooInput.toOffset(context.propsValue.offset);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    try {
      const rows = await client.call<{ model: string; name: string }[]>({
        model: 'ir.model',
        method: 'search_read',
        args: [domain],
        kwargs: { fields: ['model', 'name'], order: 'model asc, id asc', offset, limit: limit + 1 },
      });
      const hasMore = rows.length > limit;
      const models = rows.slice(0, limit).map((row) => ({ model: row.model, name: row.name }));
      return { count: models.length, offset, limit, has_more: hasMore, next_offset: hasMore ? offset + limit : null, models };
    } catch (error) {
      if (odooRpc.isAccessFault(error)) {
        throw new Error(
          'This Odoo user cannot list models (it needs Administration / Access Rights). Call odoo_get_model_fields with a known model name such as res.partner, crm.lead, sale.order or account.move instead.',
        );
      }
      throw error;
    }
  },
});
