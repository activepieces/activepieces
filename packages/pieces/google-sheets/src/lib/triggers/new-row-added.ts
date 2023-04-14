import { OAuth2PropertyValue, createTrigger } from '@activepieces/pieces-framework';
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
    sheet_id: googleSheetsCommon.sheet_id
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "value": sampleData,
    "rowId": 1
  },
  onEnable: async (context) => {
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


const polling: Polling<{ authentication: OAuth2PropertyValue, spreadsheet_id: string, sheet_id: number}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue }) => {
      const currentValues = await googleSheetsCommon.getValues(propsValue.spreadsheet_id, propsValue.authentication.access_token, propsValue.sheet_id)
      return currentValues.reverse().map((item, index) => ({
          id: currentValues.length - index,
          data: {
            value: item,
            rowId: currentValues.length - index
          },
      }));
  }
};
