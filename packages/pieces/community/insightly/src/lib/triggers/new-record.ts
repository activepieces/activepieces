import { propsValidation } from '@activepieces/pieces-common';
import {
  createTrigger,
  Property,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import {
  makeInsightlyRequest,
  insightlyAuth,
  INSIGHTLY_OBJECTS,
  insightlyCommon
} from '../common/common';

export const newRecord = createTrigger({
  auth: insightlyAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Fires when a new record is created in Insightly',
  type: TriggerStrategy.POLLING,
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description:
        'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true
    }),
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map((obj) => ({
          label: obj,
          value: obj
        }))
      }
    })
  },
  async onEnable(context) {
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
  },
  async run(context) {
    // Validate props using ActivePieces built-in validation
    await propsValidation.validateZod(
      context.propsValue,
      insightlyCommon.newRecordTriggerSchema
    );

    const { pod, objectType } = context.propsValue;
    const lastPollTime = await context.store.get<string>('lastPollTime');

    const lastPollDate = lastPollTime
      ? new Date(lastPollTime)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=false&count_total=false`,
      pod
    );

    await context.store.put('lastPollTime', new Date().toISOString());

    const records = response.body || [];

    const newRecords = records.filter((record: any) => {
      const createdDate = new Date(
        record.DATE_CREATED_UTC || record.CREATED_DATE_UTC
      );
      return createdDate > lastPollDate;
    });

    return newRecords;
  },
  async test(context) {
    // Validate props using ActivePieces built-in validation
    await propsValidation.validateZod(
      context.propsValue,
      insightlyCommon.newRecordTriggerSchema
    );

    const { pod, objectType } = context.propsValue;
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?top=1`,
      pod
    );
    return response.body || [];
  },
  sampleData: {
    RECORD_ID: 123456,
    RECORD_NAME: 'Sample Contact',
    OWNER_USER_ID: 789,
    DATE_CREATED_UTC: '2025-10-02T09:53:54.704Z',
    VISIBLE_TO: 'Everyone',
    VISIBLE_TEAM_ID: 0,
    CUSTOMFIELDS: [
      {
        FIELD_NAME: 'CUSTOM_FIELD_1',
        FIELD_VALUE: 'Sample Value'
      }
    ]
  }
});
