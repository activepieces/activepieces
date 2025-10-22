import {
  OAuth2PropertyValue,
  createTrigger
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
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
  workbookId: string
): Promise<Worksheet[]> {
  if (!workbookId) return [];

  try {
    const response = await httpClient.sendRequest<{ value: Worksheet[] }>({
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token
      }
    });
    return response.body.value ?? [];
  } catch (error) {
    throw new Error(`Failed to fetch worksheets: ${error}`);
  }
}

const polling: Polling<OAuth2PropertyValue, { workbook_id: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, store }) => {
    const worksheets = await getWorksheets(auth, propsValue.workbook_id);

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
    workbook_id: excelCommon.workbook_id
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
