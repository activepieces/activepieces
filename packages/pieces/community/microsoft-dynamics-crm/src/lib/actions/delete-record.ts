import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { deleteRecordOutputSchema } from '../common/output-schemas';

export const deleteRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Permanently deletes an existing record.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes a single record of a chosen Dynamics 365 / Dataverse entity type by its record ID. Not idempotent: a second call for the same ID fails because the record no longer exists.',
    idempotent: false,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'The table of the record to delete.'
    ),
    recordId: DynamicsCRMCommon.recordId,
  },
  outputSchema: deleteRecordOutputSchema,
  async run(context) {
    const { entityType, recordId } = context.propsValue;
    await makeClient(context.auth).deleteRecord({ entitySet: entityType, recordId });
    return { success: true, entitySet: entityType, recordId };
  },
});
