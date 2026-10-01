import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooInput } from '../common/values';
import { getRecordOutputSchema } from '../output-schemas';

export const getRecordAction = createAction({
  auth: odooAuth,
  name: 'get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Get one record of any Odoo model by picking it from a list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Odoo record of any model by ID and returns its fields, with many2one values split into an ID and a name. Use when the record is already known; to find records by criteria use a search action. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getRecordOutputSchema,
  props: {
    model: odooProps.modelDropdown(),
    record_id: odooProps.recordDropdown(),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Optional. Field names to return, for example name, email. Leave empty for all fields except files and images.',
      required: false,
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const id = odooInput.toId({ value: context.propsValue.record_id, label: 'Record' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.getRecord({ client, model, id, fields: odooInput.toStringList(context.propsValue.fields) });
  },
});
