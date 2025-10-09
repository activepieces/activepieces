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

const UpdatedRecordTriggerInputSchema = z.object({
  table: z.string().min(1),
  since: z.string().optional(),
  filter: z.string().optional(),
  pollInterval: z.number().optional(),
  sysparm_display_value: z.enum(['true', 'false', 'all']).optional(),
  sysparm_exclude_reference_link: z.boolean().optional(),
  sysparm_fields: z.array(z.string()).optional(),
  sysparm_query_no_domain: z.boolean().optional(),
});

export const updatedRecordTrigger = createTrigger({
  name: 'updated_record',
  displayName: 'Updated Record',
  description:
    'Triggers when a record is updated in a ServiceNow table using polling with ServiceNow Table API',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    since: Property.ShortText({
      displayName: 'Since Timestamp',
      description:
        'ISO timestamp to start monitoring from (optional, defaults to current time)',
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
        'How often to check for updated records in milliseconds (default: 60000)',
      required: false,
      defaultValue: 60000,
    }),
    sysparm_display_value: Property.StaticDropdown({
      displayName: 'Display Value Type',
      description: 'Type of data to return in trigger events',
      required: false,
      defaultValue: 'false',
      options: {
        disabled: false,
        options: [
          { label: 'Actual values from database', value: 'false' },
          { label: 'Display values (user-friendly)', value: 'true' },
          { label: 'Both actual and display values', value: 'all' },
        ],
      },
    }),
    sysparm_exclude_reference_link: Property.Checkbox({
      displayName: 'Exclude Reference Links',
      description:
        'Exclude Table API links for reference fields to improve performance',
      required: false,
      defaultValue: true,
    }),
    sysparm_fields: Property.Array({
      displayName: 'Fields to Include',
      description:
        'Specific fields to include in trigger events (leave empty for all fields)',
      required: false,
    }),
    sysparm_query_no_domain: Property.Checkbox({
      displayName: 'Query No Domain',
      description:
        'Include records from all domains (requires admin or query_no_domain_table_api role)',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    eventId: 'sample_sys_id_2023-01-01T00:00:00Z',
    table: 'incident',
    sys_id: 'sample_sys_id',
    operation: 'update',
    fields: {
      sys_id: 'sample_sys_id',
      number: 'INC0000001',
      short_description: 'Updated incident description',
      state: '2',
      priority: '2',
      sys_created_on: '2023-01-01 00:00:00',
      sys_updated_on: '2023-01-01 01:00:00',
    },
    timestamp: '2023-01-01T01:00:00Z',
    raw: {
      sys_id: 'sample_sys_id',
      number: 'INC0000001',
      short_description: 'Updated incident description',
      state: '2',
      priority: '2',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const {
      table,
      since,
      filter,
      sysparm_display_value,
      sysparm_exclude_reference_link,
      sysparm_fields,
      sysparm_query_no_domain,
    } = context.propsValue;

    const input = UpdatedRecordTriggerInputSchema.parse({
      table,
      since,
      filter,
      sysparm_display_value,
      sysparm_exclude_reference_link,
      sysparm_fields,
      sysparm_query_no_domain,
    });

    const startTime = input.since || new Date().toISOString();
    await context.store?.put('lastPollTime', startTime);
    await context.store?.put('triggerConfig', {
      sysparm_display_value: input.sysparm_display_value,
      sysparm_exclude_reference_link: input.sysparm_exclude_reference_link,
      sysparm_fields: input.sysparm_fields,
      sysparm_query_no_domain: input.sysparm_query_no_domain,
    });
  },
  async onDisable(context) {
    await context.store?.delete('lastPollTime');
    await context.store?.delete('triggerConfig');
  },
  async run(context) {
    const { table, filter } = context.propsValue;
    const triggerConfig = (await context.store?.get('triggerConfig')) as any;

    const client = createServiceNowClient(context.propsValue);

    const lastPollTime = (await context.store?.get('lastPollTime')) as string;
    const currentTime = new Date().toISOString();

    let query = `sys_updated_on>${lastPollTime}^sys_created_on<${lastPollTime}`;
    if (filter) {
      query += `^${filter}`;
    }

    const options = {
      limit: 100,
      fields: triggerConfig?.sysparm_fields,
      sysparm_display_value: triggerConfig?.sysparm_display_value,
      sysparm_exclude_reference_link:
        triggerConfig?.sysparm_exclude_reference_link,
      sysparm_query_no_domain: triggerConfig?.sysparm_query_no_domain,
    };

    const records = await client.findRecord(table, query, options);

    const validEvents = records.map((record) => ({
      eventId: `${record['sys_id']}_${record['sys_updated_on']}`,
      table,
      sys_id: record['sys_id'],
      operation: 'update' as const,
      fields: record,
      timestamp: record['sys_updated_on'] || currentTime,
      raw: record,
    }));

    if (validEvents.length > 0) {
      await context.store?.put('lastPollTime', currentTime);
    }

    return validEvents.map((event) => TriggerEventSchema.parse(event));
  },
});
