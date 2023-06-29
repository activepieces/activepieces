import { OAuth2PropertyValue, Property, Store, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { googleSheetsCommon } from '../common/common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sampleData = Array.from(alphabet).map(c => `${c} Value`);

const polling: Polling<{ authentication: OAuth2PropertyValue, spreadsheet_id: string, sheet_id: number, max_rows_to_poll: number | undefined }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue, lastItemId }) => {
    const currentValues = (await googleSheetsCommon.getValues(propsValue.spreadsheet_id, propsValue.authentication.access_token, propsValue.sheet_id)) ?? []
    const items = currentValues.map((item, index) => ({
      id: index + 1,
      data: item,
    })).filter(f => isNil(lastItemId) || f.data.row > (lastItemId as number));
    return items.reverse();
  }
};

export const readNewRows = createTrigger({
  name: 'new_row',
  displayName: 'New Row',
  description: 'Trigger when a new row is added, and it can include existing rows as well.',
  props: {
    authentication: googleSheetsCommon.authentication,
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
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
      maxItemsToPoll: context.propsValue.max_rows_to_poll,
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

