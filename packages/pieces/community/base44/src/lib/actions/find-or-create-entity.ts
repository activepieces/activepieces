import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth, base44Common } from '../common/client';

export const findOrCreateEntity = createAction({
  auth: base44Auth,
  name: 'find_or_create_entity',
  classification: 'WRITE',
  displayName: 'Find or Create Entity',
  description: 'Find a matching entity record, or create one if not found',
  audience: 'human',
  outputSchema: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'created', label: 'Created', format: 'boolean' },
      { key: 'entity', label: 'Entity', children: base44Common.recordFields },
    ],
  },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    searchQuery: Property.Json({
      displayName: 'Search Query',
      description: 'Query to find the entity (e.g. {"email": "john@example.com"})',
      required: true,
      defaultValue: {},
    }),
    createData: Property.Json({
      displayName: 'Create Data',
      description: 'Data to create the entity with if not found',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { entityType, searchQuery, createData } = propsValue;
    const query = base44Common.requireJsonObject({ value: searchQuery, label: 'Search Query' });
    const data = base44Common.requireJsonObject({ value: createData, label: 'Create Data' });
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    try {
      const results = base44Common.toRecordList(
        await handler.filter(query, undefined, 1),
      );
      if (results.length > 0) {
        return { found: true, created: false, entity: results[0] };
      }
      const newEntity = await handler.create(data);
      return { found: false, created: true, entity: base44Common.toRecord(newEntity) };
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'find or create the record' });
    }
  },
});
