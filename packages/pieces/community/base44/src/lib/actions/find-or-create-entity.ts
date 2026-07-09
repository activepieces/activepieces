import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth } from '../..';
import { createClient, Base44Error, type Base44Client } from '@base44/sdk';

export const findOrCreateEntity = createAction({
  auth: base44Auth,
  name: 'find_or_create_entity',
  displayName: 'Find or Create Entity',
  description: 'Find a matching entity record, or create one if not found',
  audience: 'both',
  aiMetadata: { description: 'Searches a Base44 app for an existing record of a given entity type matching a JSON query, and creates one from the supplied data only if no match is found. Use this upsert-style action to avoid duplicates when you want a record to exist but should not create a second copy. Because creation is gated on the search query, it is effectively idempotent so long as the query reliably identifies the same record.', idempotent: true },
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
    const appId = auth.props.appId;
    const token = auth.props.token;
    const { entityType, searchQuery, createData } = propsValue;

    if (!appId) {
      throw new Error('App ID is required.');
    }

    const base44: Base44Client = createClient({
      appId,
      token,
      serviceToken: token,
    });

    try {
      const entitiesModule = token
        ? base44.asServiceRole.entities as Record<string, {
            filter: (query: Record<string, unknown>) => Promise<unknown[]>;
            create: (data: Record<string, unknown>) => Promise<unknown>;
          }>
        : base44.entities as Record<string, {
            filter: (query: Record<string, unknown>) => Promise<unknown[]>;
            create: (data: Record<string, unknown>) => Promise<unknown>;
          }>;

      const results = await entitiesModule[entityType].filter(searchQuery as Record<string, unknown>);

      if (Array.isArray(results) && results.length > 0) {
        return {
          found: true,
          created: false,
          entity: results[0],
        };
      }

      const newEntity = await entitiesModule[entityType].create(createData as Record<string, unknown>);

      return {
        found: false,
        created: true,
        entity: newEntity,
      };
    } catch (error: unknown) {
      if (error instanceof Base44Error) {
        if (error.status === 404) {
          throw new Error(`Entity type "${entityType}" not found. Please check the name.`);
        }
        if (error.status === 401 || error.status === 403) {
          throw new Error('Authentication failed. Please check your credentials.');
        }
        throw new Error(`Failed: ${error.message}`);
      }
      throw new Error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
