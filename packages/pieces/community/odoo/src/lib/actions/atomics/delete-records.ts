import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooDeleteRecords = createAction({
  auth: odooAuth,
  name: 'odoo_delete_records',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Records',
  description: 'Permanently delete records of any Odoo model.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes records of any Odoo model (unlink); this cannot be undone and Odoo refuses when other records depend on them. Prefer archiving with odoo_call_method action_archive when the record should stay recoverable. Not idempotent: a second call fails because the records are gone.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.deleted,
  props: {
    model: atomicProps.modelProp(),
    ids: atomicProps.idsProp({ description: 'IDs of the records to delete, for example [12]. At most 100.' }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const ids = odooInput.toIdList({ value: context.propsValue.ids, label: 'Record IDs' });
    if (ids.length > 100) throw new Error('Record IDs: at most 100 per call.');
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.deleteRecords({ client, model, ids });
  },
});
