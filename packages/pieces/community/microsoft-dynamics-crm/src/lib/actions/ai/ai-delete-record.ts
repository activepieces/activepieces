import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { deleteRecordOutputSchema } from '../../common/output-schemas';

export const aiDeleteRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Permanently deletes a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Dynamics 365 record by entitySet and GUID; related child records may be deleted by cascade rules. Not idempotent: a repeat call fails with 404.',
    idempotent: false,
  },
  props: {
    entitySet: Property.ShortText({
      displayName: 'Entity Set',
      description: 'Entity set name (plural), for example contacts, accounts, leads or opportunities. Get it from List Entities.',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The record GUID. Get it from Search Records or a previous step.',
      required: true,
    }),
  },
  outputSchema: deleteRecordOutputSchema,
  async run(context) {
    const { entitySet, recordId } = context.propsValue;
    const id = odata.requireGuid({ value: recordId, label: 'Record ID' });
    await makeClient(context.auth).deleteRecord({ entitySet, recordId: id });
    return { success: true, entitySet, recordId: id };
  },
});
