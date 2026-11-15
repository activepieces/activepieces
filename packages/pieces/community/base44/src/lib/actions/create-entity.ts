import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const createEntity = createAction({
  auth: base44Auth,
  name: 'create_entity',
  classification: 'WRITE',
  displayName: 'Create Entity',
  description: 'Creates an entity (record) in your Base44 app',
  audience: 'both',
  outputSchema: base44Common.recordOutputSchema,
  aiMetadata: { description: 'Creates a new record of a given entity type in a Base44 app, with the field values supplied as a JSON object. Use when you need to add a new item (e.g. a Product, User, or Order) to a Base44 database. Requires the exact entity-type name (case-sensitive, as defined in the Base44 app) and matching field data. Returns the stored record including its generated id. Each call inserts a fresh record, so it is not idempotent. Returned records include the built-in fields plus every app-defined field of the entity (e.g. name, status) as top-level keys.', idempotent: false },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    entityData: Property.Json({
      displayName: 'Entity Data',
      description: 'The data to create the entity with',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType, entityData } = propsValue;
    const data = base44Common.requireJsonObject({ value: entityData, label: 'Entity Data' });
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      const result = await handler.create(data);
      return base44Common.toRecord(result);
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'create the record' });
    }
  },
});
