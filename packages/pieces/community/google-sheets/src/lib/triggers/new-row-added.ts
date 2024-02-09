import {
  OAuth2PropertyValue,
  Property,
  createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { googleSheetsAuth } from '../..';

const polling: Polling<
  OAuth2PropertyValue,
  {
    spreadsheet_id: string;
    sheet_id: number;
    max_rows_to_poll: number | undefined;
  }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const currentValues =
      (await googleSheetsCommon.getValues(
        propsValue.spreadsheet_id,
        auth.access_token,
        propsValue.sheet_id
      )) ?? [];
    const items = currentValues
      .filter((f) => Object.keys(f).length > 0)
      .map((item, index) => ({
        id: index + 1,
        data: item,
      }))
      .filter((f) => isNil(lastItemId) || f.data.row > (lastItemId as number));
    return items.reverse();
  },
};

export const readNewRows = createTrigger({
  auth: googleSheetsAuth,
  name: 'new_row',
  displayName: 'New Row',
  description:
    'Trigger when a new row is added, and it can include existing rows as well.',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
    sheet_id: googleSheetsCommon.sheet_id,
    max_rows_to_poll: Property.Number({
      displayName: 'Max Rows to Poll',
      description:
        'The maximum number of rows to poll, the rest will be polled on the next run, maximum is 10 in order to avoid errors.',
      required: false,
      defaultValue: 10,
      validators: [],
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      // Max items to poll is 10, to avoid rate limit errors
      maxItemsToPoll: Math.max(
        1,
        Math.min(10, context.propsValue.max_rows_to_poll ?? 10)
      ),
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});
