import {
  AppConnectionValueForAuthProperty,
  Property,
  createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { excelAuth } from '../auth';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof excelAuth>,
  {
    storageSource: string;
    siteId?: string;
    documentId?: string;
    workbookId: string;
    worksheetId: string;
    max_rows_to_poll: number | undefined;
  }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
    const drivePath = getDrivePath(storageSource, siteId, documentId);
    const fetchedValues =
      (await excelCommon.getAllRows(
        workbookId,
        worksheetId,
        auth.access_token,
        drivePath
      )) ?? [];

    const currentValues = fetchedValues.map((row: any[], rowIndex: number) => {
      const rowObject: any = {};
      row.forEach((cell: any, cellIndex: number) => {
        const columnName = String.fromCharCode(65 + cellIndex);
        rowObject[columnName] = cell;
      });
      return {
        row: rowIndex + 1,
        values: rowObject,
      };
    });

    const items = currentValues
      .filter((f: any) => Object.keys(f.values).length > 0)
      .map((item: any, index: number) => ({
        id: index + 1,
        data: item,
      }))
      .filter(
        (f: any) => isNil(lastItemId) || f.data.row > (lastItemId as number)
      );

    return items.reverse();
  },
};

export const readNewRows = createTrigger({
  auth: excelAuth,
  name: 'new_row',
  displayName: 'New Row',
  description:
    'Trigger when a new row is added, and it can include existing rows as well.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    max_rows_to_poll: Property.Number({
      displayName: 'Max Rows to Poll',
      description:
        'The maximum number of rows to poll, the rest will be polled on the next run.',
      required: false,
      defaultValue: 10,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},
  onEnable: async (context) => {
    const { storageSource, siteId, documentId } = context.propsValue as any;
    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
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
      maxItemsToPoll: Math.max(
        1,
        Math.min(10, context.propsValue.max_rows_to_poll ?? 10)
      ),
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
