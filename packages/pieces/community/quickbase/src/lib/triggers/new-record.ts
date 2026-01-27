import { createTrigger, TriggerStrategy, StaticPropsValue, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseRecordResponse, QuickbaseField } from '../common/types';
import { generateDeduplicationKey, extractRecordValues } from '../common/utils';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

const props = {
  appId: appIdProp,
  tableId: tableIdProp,
};

type QuickbaseAuth = AppConnectionValueForAuthProperty<typeof quickbaseAuth>;

const polling: Polling<QuickbaseAuth, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }: { auth: QuickbaseAuth; propsValue: StaticPropsValue<typeof props>; lastFetchEpochMS: number }) => {
    const { appId, tableId } = propsValue;
    const client = new QuickbaseClient(auth.props.realmHostname, auth.props.userToken);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    const dateCreatedField = tableFields.find(
      (f) => f.fieldType === 'timestamp' && f.label.toLowerCase().includes('created')
    );

    if (!dateCreatedField) {
      throw new Error(
        'No date created field found in table. A timestamp field with "created" in the name is required.'
      );
    }

    const query = {
      from: tableId,
      select: tableFields.map((f) => f.id),
      sortBy: [{ fieldId: dateCreatedField.id, order: 'DESC' as const }],
      options: { top: 100 },
    };

    const response = await client.post<QuickbaseRecordResponse>('/records/query', query);

    const isTest = lastFetchEpochMS === 0;

    return response.data
      .map((record) => {
        const recordId = record['3']?.value;
        const dateCreated = record[dateCreatedField.id.toString()]?.value;

        const epoch = dateCreated ? new Date(dateCreated).getTime() : Date.now();

        return {
          epochMilliSeconds: epoch,
          data: {
            id: generateDeduplicationKey(recordId, dateCreated),
            created_at: dateCreated,
            updated_at:
              record[
                tableFields.find(
                  (f) => f.fieldType === 'timestamp' && f.label.toLowerCase().includes('modified')
                )?.id.toString() || ''
              ]?.value || dateCreated,
            recordId,
            tableId,
            appId,
            fields: extractRecordValues(record),
          },
        };
      })
      .filter((item) => isTest || item.epochMilliSeconds > lastFetchEpochMS);
  },
};

export const newRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a Quickbase table',
  auth: quickbaseAuth,
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {},
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