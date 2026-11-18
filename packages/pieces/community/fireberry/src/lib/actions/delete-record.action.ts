import { createAction, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../auth';
import { objectTypeDropdown, fireberryProps } from '../common/props';
import { FireberryClient, fireberryUtils } from '../common/client';
import { fireberryOutputSchemas } from '../common/output-schemas';

const recordsToDeleteDropdown = Property.MultiSelectDropdown({
  auth: fireberryAuth,
  displayName: 'Records to Delete',
  required: true,
  refreshers: ['objectType'],
  options: async ({ auth, objectType }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Fireberry account' };
    }
    return fireberryProps.recordOptions({ token: auth.secret_text, objectType, top: 100 });
  },
});

export const deleteRecordAction = createAction({
  name: 'delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Records',
  description: 'Delete records from Fireberry.',
  audience: 'human',
  auth: fireberryAuth,
  outputSchema: fireberryOutputSchemas['deleteRecords'],
  props: {
    objectType: objectTypeDropdown,
    recordIds: recordsToDeleteDropdown,
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      required: true,
      description: 'Check this box to confirm you want to permanently delete the selected records. This action cannot be undone.',
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { objectType, recordIds, confirmDeletion } = propsValue;
    if (!confirmDeletion) {
      throw new Error('You must confirm deletion by checking the confirmation box');
    }
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      throw new Error('At least one record must be selected for deletion');
    }
    if (recordIds.length > 20) {
      throw new Error('Maximum 20 records can be deleted at once');
    }
    const ids = recordIds.map((id) => String(id));
    const deletedIds: string[] = [];
    for (const recordId of ids) {
      try {
        await client.deleteRecord({ objectSystemName: objectType, recordId });
      } catch (error) {
        const done = deletedIds.length > 0 ? ` Already deleted: ${deletedIds.join(', ')}.` : '';
        throw new Error(`Failed to delete record ${recordId}: ${fireberryUtils.errorMessage(error)}.${done}`);
      }
      deletedIds.push(recordId);
    }
    return { deletedIds, deletedCount: deletedIds.length };
  },
});
