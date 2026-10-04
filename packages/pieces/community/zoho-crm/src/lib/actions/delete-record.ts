import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { requireApiName, requireId } from '../common/client';
import { moduleDropdown, recordDropdown } from '../common/props';
import { deleteRecord } from '../common/records';
import { deleteOutputSchema } from '../output-schemas';

export const deleteRecordAction = createAction({
  auth: zohoCrmAuth,
  name: 'delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes a record (it moves to the Zoho CRM Recycle Bin).',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes one Zoho CRM record by module and id; it moves to the Recycle Bin and can be restored from the Zoho UI. Use only when the record must go; to change it use Update Record. Not idempotent: deleting the same id again returns an error.',
    idempotent: false,
  },
  props: {
    module: moduleDropdown({ filter: 'deletable' }),
    record_id: recordDropdown(),
    run_workflows: Property.Checkbox({
      displayName: 'Run Workflows',
      description: 'Run delete workflows configured in Zoho (Zoho default: on).',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: deleteOutputSchema,
  async run({ auth, propsValue }) {
    return deleteRecord({
      auth,
      module: requireApiName({ value: propsValue.module, name: 'Module' }),
      id: requireId({ value: propsValue.record_id, name: 'Record' }),
      runWorkflows: propsValue.run_workflows !== false,
    });
  },
});
