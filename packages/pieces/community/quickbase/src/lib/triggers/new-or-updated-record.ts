import { AppConnectionValueForAuthProperty, createTrigger, StaticPropsValue, TriggerStrategy } from "@activepieces/pieces-framework";
import { quickbaseAuth } from "../..";
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { QuickbaseClient } from "../common/client";
import { QuickbaseRecordResponse, QuickbaseField } from "../common/types";
import { appIdProp, tableIdProp } from "../common/props";
type QuickbaseAuth = AppConnectionValueForAuthProperty<typeof quickbaseAuth>;
const props = {
  appId: appIdProp,
  tableId: tableIdProp,
}
const polling: Polling<QuickbaseAuth, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { tableId, } = propsValue;
    const client = new QuickbaseClient(auth.props.realmHostname, auth.props.userToken);
    
    const fields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);

    const select = fields.map((f) => f.id);

    const modifiedField = fields.find(
      (f) => /modified/i.test(f.label) && (f.fieldType === 'timestamp' || f.fieldType === 'date')
    );

    const anyTimeField = fields.find((f) => f.fieldType === 'timestamp' || f.fieldType === 'date');

    const timeFieldId = (modifiedField || anyTimeField)?.id || 6;

    const query = {
      from: tableId,
      select,
      sortBy: [
        {
          fieldId: timeFieldId,
          order: 'DESC',
        },
      ],
      options: {
        top: 100,
      },
    };

    const response = await client.post<QuickbaseRecordResponse>('/records/query', query);

    const isTest = lastFetchEpochMS === 0;

    return response.data
      .map((record) => {
        const timeFieldKey = timeFieldId.toString();
        const rawValue = record[timeFieldKey]?.value;

        let epoch: number;
        if (rawValue) {
          epoch = new Date(rawValue).getTime();
        } else {
       
          epoch = Date.now();
        }

        return {
          epochMilliSeconds: epoch,
          data: record,
        };
      })
      .filter((item) => item.epochMilliSeconds > lastFetchEpochMS);
  },
};

export const newOrUpdatedRecord = createTrigger({
  auth: quickbaseAuth,
  name: 'new_or_updated_record',
  displayName: 'New or Updated Record',
  description: 'Triggers when a record is created or updated in a Quickbase table',
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
});