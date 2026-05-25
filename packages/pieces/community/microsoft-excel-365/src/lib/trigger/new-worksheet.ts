import {
  AppConnectionValueForAuthProperty,
  OAuth2PropertyValue,
  createTrigger
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelAuth } from '../auth';
import {
  Polling,
  pollingHelper,
  DedupeStrategy
} from '@activepieces/pieces-common';

interface Worksheet {
  id: string;
  name: string;
  position: number;
  visibility: string;
}

async function getWorksheets(
  auth: OAuth2PropertyValue,
  workbookId: string,
  drivePath: string
): Promise<Worksheet[]> {
  if (!workbookId) return [];

  try {
    const cloud = auth.props?.['cloud'] as string | undefined;
    const client = createMSGraphClient(auth.access_token, cloud);
    const response = await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets`)
      .get();
    return response.value ?? [];
  } catch (error) {
    throw new Error(`Failed to fetch worksheets: ${error}`);
  }
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof excelAuth>, { storageSource: string; siteId?: string; documentId?: string; workbookId: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, store }) => {
    const { storageSource, siteId, documentId, workbookId } = propsValue;
    const drivePath = getDrivePath(storageSource, siteId, documentId);
    const worksheets = await getWorksheets(auth, workbookId, drivePath);

    const storedWorksheetIds = await store.get<string[]>('worksheet_ids') ?? [];

    const newWorksheets = worksheets.filter(ws => !storedWorksheetIds.includes(ws.id));

    const currentWorksheetIds = worksheets.map(ws => ws.id);
    await store.put('worksheet_ids', currentWorksheetIds);

    const processedWorksheets = newWorksheets.map((worksheet) => ({
      id: worksheet.id,
      data: worksheet
    }));

    return processedWorksheets;
  }
};

export const newWorksheetTrigger = createTrigger({
  auth: excelAuth,
  name: 'new_worksheet',
  displayName: 'New Worksheet',
  description: 'Fires when a new worksheet is created in a workbook.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    '@odata.id':
      '/workbook/worksheets(%27%7B00000000-0001-0000-0100-000000000000%7D%27)',
    id: '{00000000-0001-0000-0100-000000000000}',
    name: 'Sheet2',
    position: 1,
    visibility: 'Visible'
  },

  onEnable: async (context) => {
    const { storageSource, siteId, documentId } = context.propsValue as any;
    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue
    });
  },

  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue
    });
  },

  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files
    });
  },

  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files
    });
  }
});
