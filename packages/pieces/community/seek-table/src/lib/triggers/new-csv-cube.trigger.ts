import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { seekTableAuth } from '../../lib/common/auth';
import { seekTableApiCall } from '../../lib/common/client';

interface Cube {
  Id: string;
  Name: string;
  SourceType: string;
  SourceTypeId: string;
  SourceFile?: string;
  CreateDate: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof seekTableAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await seekTableApiCall({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: 'api/cube',
    }) as Cube[];

    // Filter only CSV cubes and map to polling format
    return response
      .filter(cube => cube.SourceTypeId === 'file-csv')
      .map((cube) => ({
        epochMilliSeconds: Date.parse(cube.CreateDate),
        data: cube,
      }));
  },
};

export const newCsvCubeTrigger = createTrigger({
  auth: seekTableAuth,
  name: 'new_csv_cube',
  displayName: 'New CSV Cube',
  description: 'Triggers when a new CSV cube is added to your SeekTable account.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    Id: "7f74de2546804cf9b12da34d7e5af382",
    Name: "Superstore Sales",
    SourceType: "File (CSV)",
    SourceTypeId: "file-csv",
    SourceFile: "Superstore Sales.zip",
    CreateDate: "2024-10-19T08:14:50.736952"
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
