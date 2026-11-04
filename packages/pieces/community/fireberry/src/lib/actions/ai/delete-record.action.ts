import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../../auth';
import { FireberryClient } from '../../common/client';
import { fireberryOutputSchemas } from '../../common/output-schemas';

export const aiDeleteRecordAction = createAction({
  auth: fireberryAuth,
  name: 'ai_delete_record',
  displayName: 'Delete Record',
  description: 'Permanently deletes one Fireberry record.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: fireberryOutputSchemas['deleteRecord'],
  aiMetadata: {
    description: 'Permanently deletes one Fireberry record by object type and record id. This cannot be undone; confirm the id (e.g. with Get Record) before calling. Idempotent: deleting an id that is already gone also succeeds.',
    idempotent: true,
  },
  props: {
    objectSystemName: Property.ShortText({
      displayName: 'Object System Name',
      description: 'System name of the Fireberry object type, as returned by List Object Types (e.g. Account, Contact, Opportunity, Cases). The numeric objectType (e.g. 1 for Account, 2 for Contact) is also accepted.',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The record GUID to delete.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { systemName: objectSystemName } = await client.resolveObject(propsValue.objectSystemName);
    const recordId = propsValue.recordId.trim();
    await client.deleteRecord({ objectSystemName, recordId });
    return { id: recordId, objectSystemName, deleted: true };
  },
});
