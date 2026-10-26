import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi, salesforcesCommon } from '../common';
import { salesforceUtils } from '../common/utils';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';
import { newRecordTriggerOutputSchema } from '../output-schemas';

export const newOrUpdatedRecord = createTrigger({
  auth: salesforceAuth,
  name: 'new_or_updated_record',
  classification: 'READ',
  displayName: 'New or Updated Record',
  description: 'Fires when a record of the chosen object is created or changed.',
  aiMetadata: {
    description: 'Fires whenever a record of the selected Salesforce object is created or updated, detected by polling for records whose LastModifiedDate is later than the last poll. Each event emits all fields of the changed record. An optional SOQL where-clause condition can further filter which records trigger the event.',
  },
  outputSchema: newRecordTriggerOutputSchema,
  props: {
    object: salesforcesCommon.object,
    conditions: Property.LongText({
      displayName: 'Conditions',
      description: 'SOQL conditions to filter by, without the WHERE keyword.',
      placeholder: "Industry = 'Technology'",
      required: false,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
});

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof salesforceAuth>,
  { object: string | undefined; conditions: string | undefined }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await getRecords(
      auth,
      propsValue.object!,
      dayjs(lastFetchEpochMS).toISOString(),
      propsValue.conditions
    );
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.LastModifiedDate).valueOf(),
      data: item,
    }));
  },
};

const getRecords = async (
  authentication: AppConnectionValueForAuthProperty<typeof salesforceAuth>,
  object: string,
  startDate: string,
  conditions: string | undefined
) => {
  const response = await querySalesforceApi<{
    records: { LastModifiedDate: string }[];
  }>(
    HttpMethod.GET,
    authentication,
    salesforceUtils.buildPollingQuery({ object, dateField: 'LastModifiedDate', startDate, conditions })
  );
  return response.body['records'];
};
