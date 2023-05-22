import { OAuth2PropertyValue, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { googleSheetsCommon } from '../common/common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sampleData = Array.from(alphabet).map(c => `${c} Value`);
Array.from(alphabet).forEach(c => sampleData.push(`${c}${c} Value`));

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row',
  description: 'Triggers when there is a new row added',
  props: {
    authentication: googleSheetsCommon.authentication,
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    sheet_id: googleSheetsCommon.sheet_id,
    max_rows_to_poll: Property.Number({
      displayName: 'Max Rows to Poll',
      description: 'The maximum number of rows to poll, the rest will be polled on the next run',
      required: false,
    })
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "value": sampleData,
    "rowId": 1
  },
  onEnable: async (context) => {
    context.setSchedule({
      cronExpression: '*/1 * * * *',
    })
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
    })
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
    })
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});


const polling: Polling<{ authentication: OAuth2PropertyValue, spreadsheet_id: string, sheet_id: number, max_rows_to_poll: number | undefined }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue, lastItemId }) => {
    const currentValues = (await googleSheetsCommon.getValues(propsValue.spreadsheet_id, propsValue.authentication.access_token, propsValue.sheet_id)) ?? []
    const items = currentValues.map((item, index) => ({
      id: index + 1,
      data: {
        value: item,
        rowId: index + 1
      },
    }));
    // Results are expected to be from newest to oldest, that is why we reverse the array
    const lastItemIndex = items.findIndex(f => f.id === lastItemId);
    if (propsValue.max_rows_to_poll === undefined) {
      return items.reverse();
    }
    const result = items?.slice(lastItemIndex + 1, lastItemIndex + 1 + propsValue.max_rows_to_poll).reverse() ?? [];
    return result;
  }
};
