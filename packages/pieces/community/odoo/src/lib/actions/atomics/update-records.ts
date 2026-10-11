import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooUpdateRecords = createAction({
  auth: odooAuth,
  name: 'odoo_update_records',
  classification: 'WRITE',
  displayName: 'Update Records',
  description: 'Set field values on one or more records of any Odoo model.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Writes the given field values to one or more records of any Odoo model (write). Only the fields in Values change; every other field keeps its value. Send null or false to clear a field. Idempotent for plain values: writing the same values again leaves the records unchanged. x2many commands such as [0, 0, {...}] add lines on every call, so a retry can duplicate them; that is why this action is marked not idempotent.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.updated,
  props: {
    model: atomicProps.modelProp(),
    ids: atomicProps.idsProp({ description: 'IDs of the records to update, for example [12]. At most 500.' }),
    values: Property.Json({
      displayName: 'Values',
      description:
        'JSON object with only the fields to change, for example {"phone": "+1 555 0100"}. Same value format as odoo_create_record (IDs for many2one, command lists for many2many).',
      required: true,
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const ids = odooInput.toIdList({ value: context.propsValue.ids, label: 'Record IDs' });
    if (ids.length > 500) throw new Error('Record IDs: at most 500 per call.');
    const values = odooInput.parseObject({ value: context.propsValue.values, label: 'Values' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    await odooRecords.assertKnownFields({ client, model, names: Object.keys(values) });
    await client.call<boolean>({ model, method: 'write', args: [ids, values] });
    return { success: true, model, ids, updated_count: ids.length };
  },
});
