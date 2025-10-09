import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { TriggerEventSchema } from '../common/types';
import {
  serviceNowAuth,
  tableDropdown,
  createServiceNowClient,
} from '../common/props';

const NewRecordTriggerInputSchema = z.object({
  table: z.string().min(1),
  since: z.string().optional(),
  filter: z.string().optional(),
  pollInterval: z.number().optional(),
});

export const newRecordTrigger = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a ServiceNow table',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    since: Property.ShortText({
      displayName: 'Since Timestamp',
      description: 'ISO timestamp to start monitoring from (optional)',
      required: false,
    }),
    filter: Property.LongText({
      displayName: 'Filter Query',
      description:
        'Optional ServiceNow encoded query to filter records (e.g., priority=1^state=1)',
      required: false,
    }),
    pollInterval: Property.Number({
      displayName: 'Poll Interval (ms)',
      description:
        'How often to check for new records in milliseconds (default: 60000)',
      required: false,
      defaultValue: 60000,
    }),
  },
  sampleData: {
    eventId: 'sample_sys_id_2023-01-01T00:00:00Z',
    table: 'incident',
    sys_id: 'sample_sys_id',
    operation: 'create',
    fields: {
      sys_id: 'sample_sys_id',
      number: 'INC0000001',
      short_description: 'Sample incident',
      state: '1',
      priority: '3',
      sys_created_on: '2023-01-01 00:00:00',
      sys_updated_on: '2023-01-01 00:00:00',
    },
    timestamp: '2023-01-01T00:00:00Z',
    raw: {
      sys_id: 'sample_sys_id',
      number: 'INC0000001',
      short_description: 'Sample incident',
      state: '1',
      priority: '3',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { table, since, filter } = context.propsValue;

    const input = NewRecordTriggerInputSchema.parse({ table, since, filter });
    const startTime = input.since || new Date().toISOString();
    await context.store?.put('lastPollTime', startTime);
  },
  async onDisable(context) {
    await context.store?.delete('lastPollTime');
  },
  async run(context) {
    const { table, filter } = context.propsValue;

    const input = NewRecordTriggerInputSchema.parse({ table, filter });
    const client = createServiceNowClient(context.propsValue);

    const lastPollTime = (await context.store?.get('lastPollTime')) as string;
    const currentTime = new Date().toISOString();

    let query = `sys_created_on>${lastPollTime}`;
    if (input.filter) {
      query += `^${input.filter}`;
    }

    const eventList = await client.pollTableEvents(
      input.table,
      lastPollTime,
      100,
      {
        sysparm_query: query,
      }
    );

    const validEvents = eventList.events.map((event) => ({
      ...event,
      operation: 'create' as const,
    }));

    if (validEvents.length > 0) {
      await context.store?.put('lastPollTime', currentTime);
    }

    return validEvents.map((event) => TriggerEventSchema.parse(event));
  },
});
