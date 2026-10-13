import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooGetModelFields = createAction({
  auth: odooAuth,
  name: 'odoo_get_model_fields',
  classification: 'READ',
  displayName: 'Get Model Fields',
  description: 'List the fields of an Odoo model with their type, whether they are required, and allowed values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Describes the fields of one Odoo model on this server (fields_get): name, label, type, required, read-only, related model and allowed selection values. Use before creating or updating records or writing a domain, because field names differ between Odoo versions and installed apps. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.modelFields,
  props: {
    model: atomicProps.modelProp(),
    field_names: Property.Array({
      displayName: 'Only These Fields',
      description: 'Optional list of field names to describe, for example ["partner_id", "state"]. Empty = all fields.',
      required: false,
    }),
    required_only: Property.Checkbox({
      displayName: 'Required Fields Only',
      description: 'Only return fields that must be set when creating a record.',
      required: false,
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const only = odooInput.toStringList(context.propsValue.field_names);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const map = await client.fieldsGet(model);
    const fields = Object.entries(map)
      .filter(([name]) => only.length === 0 || only.includes(name))
      .filter(([, info]) => !context.propsValue.required_only || info.required === true)
      .map(([name, info]) => ({
        name,
        label: info.string ?? name,
        type: info.type,
        required: info.required === true,
        readonly: info.readonly === true,
        relation: info.relation ?? null,
        selection: Array.isArray(info.selection) ? info.selection.map(([value, label]) => ({ value, label })) : [],
        help: typeof info.help === 'string' ? info.help : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { model, count: fields.length, fields };
  },
});
