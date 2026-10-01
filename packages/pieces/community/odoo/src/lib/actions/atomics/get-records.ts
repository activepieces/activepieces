import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooGetRecords = createAction({
  auth: odooAuth,
  name: 'odoo_get_records',
  classification: 'READ',
  displayName: 'Get Records by ID',
  description: 'Read one or more records of any Odoo model by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads records of any Odoo model by their IDs (read) and returns the chosen fields, many2one values split into field and field_name. Use when the IDs are known; fails if any ID does not exist or is not readable. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.genericRecords,
  props: {
    model: atomicProps.modelProp(),
    ids: atomicProps.idsProp({ description: 'Record IDs, for example [12, 15]. At most 500.' }),
    fields: atomicProps.fieldsProp(),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const ids = odooInput.toIdList({ value: context.propsValue.ids, label: 'Record IDs' });
    if (ids.length > 500) throw new Error('Record IDs: at most 500 per call.');
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const { names, map } = await odooRecords.resolveFields({ client, model, fields: odooInput.toStringList(context.propsValue.fields) });
    const fields = names.includes('display_name') || !('display_name' in map) ? names : [...names, 'display_name'];
    const records = await odooRecords.readByIds({ client, model, ids, fields, map });
    return { model, count: records.length, records };
  },
});
