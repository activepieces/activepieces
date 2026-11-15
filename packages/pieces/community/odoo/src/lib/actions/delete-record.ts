import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooInput } from '../common/values';
import { deleteRecordOutputSchema } from '../output-schemas';

export const deleteRecordAction = createAction({
  auth: odooAuth,
  name: 'delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Permanently delete a record of any Odoo model. This cannot be undone.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes one Odoo record of any model (unlink). Odoo may refuse when other records depend on it; archiving via Run Record Action with action_archive is the recoverable alternative. Not idempotent: a second call fails because the record is gone.',
    idempotent: false,
  },
  outputSchema: deleteRecordOutputSchema,
  props: {
    model: odooProps.modelDropdown(),
    record_id: odooProps.recordDropdown({ displayName: 'Record to Delete' }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const id = odooInput.toId({ value: context.propsValue.record_id, label: 'Record' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const result = await odooOperations.deleteRecords({ client, model, ids: [id] });
    return { success: result.success, model, deleted_id: id };
  },
});
