import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { oracleFusionAuth } from '../../auth';
import { callOracleApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Fires when new records are created in the specified object path.',
  auth: oracleFusionAuth,
  type: TriggerStrategy.POLLING,
  props: {
    objectPath: Property.ShortText({ displayName: 'Object Path', required: true }),
    timestampField: Property.ShortText({
      displayName: 'Timestamp Field',
      description: 'Field to compare for new records (e.g., CreationDate, LastUpdateDateTime)',
      required: true,
    }),
    since: Property.ShortText({
      displayName: 'Since (ISO 8601)',
      description: 'Initial timestamp to start from (defaults to now on enable)',
      required: false,
    }),
    limit: Property.Number({ displayName: 'Limit', required: false, defaultValue: 50 }),
  },
  sampleData: {},
  async onEnable(ctx) {
    const since = ctx.propsValue.since || new Date().toISOString();
    await ctx.store.put('lastTs', since);
  },
  async onDisable(ctx) {
    await ctx.store.delete('lastTs');
  },
  async run(ctx) {
    const { objectPath, timestampField, limit } = ctx.propsValue;
    const lastTs = (await ctx.store.get('lastTs')) as string | undefined;
    const fromTs = lastTs ?? new Date().toISOString();

    const q = `${timestampField}>'${fromTs}'`;
    const res = await callOracleApi<{ items?: unknown[] }>({
      auth: ctx.auth,
      method: HttpMethod.GET,
      resourcePath: `/fscmRestApi/resources/11.13.18.05/${objectPath}`,
      query: { q, limit: limit ?? 50 },
    });

    const now = new Date().toISOString();
    await ctx.store.put('lastTs', now);

    return res?.items ?? [];
  },
});
