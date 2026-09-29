import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooCreateRecord = createAction({
  auth: odooAuth,
  name: 'odoo_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Create a record in any Odoo model from a JSON object of field values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one record in any Odoo model from field values (create) and returns its id and display name. Use when no app-specific create action fits; check required fields with odoo_get_model_fields first. Not idempotent: each call creates a new record.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.created,
  props: {
    model: atomicProps.modelProp(),
    values: Property.Json({
      displayName: 'Values',
      description:
        'JSON object of field values, for example {"name": "Acme", "is_company": true}. Many2one fields take an ID. Many2many/one2many fields take command lists: [[6, 0, [3, 4]]] replaces with IDs 3 and 4, [[4, 7]] adds ID 7, [[0, 0, {"name": "line"}]] creates a line.',
      required: true,
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const values = odooInput.parseObject({ value: context.propsValue.values, label: 'Values' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const id = await client.call<number>({ model, method: 'create', args: [values] });
    const rows = await client.call<{ display_name?: unknown }[]>({ model, method: 'read', args: [[id]], kwargs: { fields: ['display_name'] } });
    const displayName = rows[0]?.display_name;
    return { id, model, display_name: typeof displayName === 'string' ? displayName : null };
  },
});
