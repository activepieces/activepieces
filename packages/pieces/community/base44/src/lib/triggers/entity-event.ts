import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  pollingHelper,
  Polling,
} from '@activepieces/pieces-common';
import { base44Auth } from '../..';
import { createClient, Base44Error, type Base44Client } from '@base44/sdk';

type Base44AuthType = AppConnectionValueForAuthProperty<typeof base44Auth>;

const polling: Polling<Base44AuthType, { entityType: string; eventType: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const appId = auth.props.appId;
    const token = auth.props.token;
    const { entityType, eventType } = propsValue;

    const base44: Base44Client = createClient({
      appId,
      token,
      serviceToken: token,
    });

    try {
      const entitiesModule = token
        ? base44.asServiceRole.entities as Record<string, {
            list: (sort?: string, limit?: number, skip?: number) => Promise<unknown[]>;
          }>
        : base44.entities as Record<string, {
            list: (sort?: string, limit?: number, skip?: number) => Promise<unknown[]>;
          }>;

      const sortField = eventType === 'created' ? '-created_date' : '-updated_date';
      const results = await entitiesModule[entityType].list(sortField, 100);

      if (!Array.isArray(results)) {
        return [];
      }

      return results
        .filter((item: any) => {
          const timestamp = eventType === 'created'
            ? new Date(item.created_date).getTime()
            : new Date(item.updated_date).getTime();
          return timestamp > lastFetchEpochMS;
        })
        .map((item: any) => {
          const timestamp = eventType === 'created'
            ? new Date(item.created_date).getTime()
            : new Date(item.updated_date).getTime();
          return {
            epochMilliSeconds: timestamp,
            data: {
              ...item,
              _eventType: eventType,
              _entityType: entityType,
            },
          };
        });
    } catch (error) {
      if (error instanceof Base44Error) {
        console.error(`Base44 Error: ${error.message}`);
      }
      return [];
    }
  },
};

export const entityEvent = createTrigger({
  auth: base44Auth,
  name: 'entity_event',
  displayName: 'Entity Event',
  description: 'Triggers when an entity is created or updated',
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'When to trigger',
      required: true,
      defaultValue: 'created',
      options: {
        disabled: false,
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'sample-entity-id',
    created_date: '2024-01-01T00:00:00.000Z',
    updated_date: '2024-01-01T00:00:00.000Z',
    _eventType: 'created',
    _entityType: 'Product',
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
});
