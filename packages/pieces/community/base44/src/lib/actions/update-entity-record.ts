import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const updateEntityRecord = createAction({
  auth: base44Auth,
  name: 'update_entity_record',
  classification: 'WRITE',
  displayName: 'Update Entity Record',
  description: 'Updates fields of an existing entity record',
  audience: 'both',
  outputSchema: base44Common.recordOutputSchema,
  aiMetadata: { description: 'Updates an existing record of a given entity type in a Base44 app by record ID. Only the fields present in the JSON data are changed; other fields keep their values. Use when a known record needs new values (e.g. change an Order status). Returns the updated record. Setting the same values again yields the same result, so it is idempotent.', idempotent: true },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to update',
      required: true,
    }),
    updateData: Property.Json({
      displayName: 'Update Data',
      description: 'Fields to change (e.g. {"status": "shipped"}). Fields not included are left unchanged.',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType, recordId, updateData } = propsValue;
    const data = base44Common.toRecord(updateData);
    if (Object.keys(data).length === 0) {
      throw new Error('Update Data must contain at least one field.');
    }
    const id = base44Common.requireText({ value: recordId, label: 'Record ID' });
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      return base44Common.toRecord(await handler.update(id, data));
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'update the record' });
    }
  },
});
