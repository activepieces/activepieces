import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fireberryAuth } from '../common/auth';
import { fireberryApiCall } from '../common/client';

const LAST_TIMESTAMP_KEY = 'fireberry-last-record-timestamp';

export const newOrUpdatedRecordTrigger = createTrigger({
  auth: fireberryAuth,
  name: 'new_or_updated_record',
  displayName: 'Record Created or Updated',
  description: 'Triggers when a record is created or updated in a specified Fireberry object type.',
  type: TriggerStrategy.POLLING,

  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new or updated records.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
    objectCode: Property.Number({
      displayName: 'Object Code',
      description: 'Numeric code of the Fireberry object to watch.',
      required: true,
    }),
  },

  async onEnable(context) {
    const { objectCode } = context.propsValue;
    const now = new Date().toISOString();
    await context.store.put<string>(LAST_TIMESTAMP_KEY, now);
    console.log(`Initialized trigger timestamp to ${now} for object ${objectCode}`);
  },

  async onDisable() {
    console.log('Fireberry Record Created/Updated trigger disabled');
  },

  async run(context) {
    const { objectCode } = context.propsValue;
    const lastTs = (await context.store.get<string>(LAST_TIMESTAMP_KEY)) || new Date(0).toISOString();
    
    const response = await fireberryApiCall<{ data: any[] }>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: `/record/${objectCode}`,
      query: { modifiedSince: lastTs },
    });

    const records: any[] = response.data || [];
    const now = new Date().toISOString();
    await context.store.put<string>(LAST_TIMESTAMP_KEY, now);

    return records.map((rec) => ({
      id: rec.id || rec.guid || rec.ID,
      ...rec,
      triggerInfo: {
        detectedAt: now,
        source: 'fireberry',
        type: 'record_' + (new Date(rec.modifiedOn) > new Date(lastTs) ? 'updated' : 'created'),
      },
    }));
  },

  async test(context) {
    const { objectCode } = context.propsValue;
    const now = new Date().toISOString();
    const response = await fireberryApiCall<{ data: any[] }>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: `/record/${objectCode}`,
      query: { limit: 1 },
    });

    const rec = (response.data || [])[0];
    return rec
      ? [
          {
            id: rec.id || rec.guid || rec.ID,
            ...rec,
            triggerInfo: {
              detectedAt: now,
              source: 'fireberry',
              type: 'record_test',
            },
          },
        ]
      : [];
  },

  sampleData: {
    id: '1234-5678-abcd',
    name: 'Sample Record',
    ownerid: '90ab-cdef-1234',
    modifiedOn: '2025-07-15T12:34:56.000Z',
    additionalFields: {},
    triggerInfo: {
      detectedAt: new Date().toISOString(),
      source: 'fireberry',
      type: 'record_test',
    },
  },
});
