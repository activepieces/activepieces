import { createAction, Property } from '@activepieces/pieces-framework';
import { base44Auth } from '../..';
import { createClient, Base44Error, type Base44Client } from '@base44/sdk';

export const createEntity = createAction({
  auth: base44Auth,
  name: 'create_entity',
  displayName: 'Create Entity',
  description: 'Creates an entity (record) in your Base44 app',
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
    const appId = auth.props.appId;
    const token = auth.props.token;
    const { entityType, entityData } = propsValue;

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
        ? base44.asServiceRole.entities as Record<string, { create: (data: Record<string, unknown>) => Promise<unknown> }>
        : base44.entities as Record<string, { create: (data: Record<string, unknown>) => Promise<unknown> }>;

      const result = await entitiesModule[entityType].create(entityData as Record<string, unknown>);
      return result;
    } catch (error: unknown) {
      if (error instanceof Base44Error) {
        if (error.status === 404) {
          throw new Error(`Entity type "${entityType}" not found. Please check the name.`);
        }
        if (error.status === 401 || error.status === 403) {
          throw new Error('Authentication failed. Please check your credentials.');
        }
        throw new Error(`Failed to create entity: ${error.message}`);
      }
      throw new Error(`Failed to create entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
