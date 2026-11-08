import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const getEntityRecord = createAction({
  auth: base44Auth,
  name: 'get_entity_record',
  classification: 'READ',
  displayName: 'Get Entity Record',
  description: 'Retrieves a single entity record by its ID',
  audience: 'both',
  outputSchema: base44Common.recordOutputSchema,
  aiMetadata: { description: 'Fetches one record of a given entity type from a Base44 app by its record ID and returns all of its fields. Use when you already know the record ID (from List Entity Records, Find Entity Record, or a trigger) and need its current values. Fails with a not-found error if the ID or entity type is wrong. Read-only and idempotent. Returned records include the built-in fields plus every app-defined field of the entity (e.g. name, status) as top-level keys.', idempotent: true },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType, recordId } = propsValue;
    const id = base44Common.requireText({ value: recordId, label: 'Record ID' });
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      return base44Common.toRecord(await handler.get(id));
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'get the record' });
    }
  },
});
