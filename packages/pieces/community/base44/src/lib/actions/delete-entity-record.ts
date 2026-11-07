import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const deleteEntityRecord = createAction({
  auth: base44Auth,
  name: 'delete_entity_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Entity Record',
  description: 'Permanently deletes an entity record by its ID',
  audience: 'both',
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'id', label: 'Deleted Record ID' },
    ],
  },
  aiMetadata: { description: 'Permanently deletes one record of a given entity type from a Base44 app by record ID. Use only when the user clearly wants the record removed; it cannot be undone. Deleting an ID that no longer exists fails with a not-found error, so it is not idempotent.', idempotent: false },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType } = propsValue;
    const recordId = base44Common.requireText({ value: propsValue.recordId, label: 'Record ID' });
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      const result = await handler.delete(recordId);
      const success = base44Common.readField({ source: result, key: 'success' });
      return { success: success !== false, id: recordId };
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'delete the record' });
    }
  },
});
