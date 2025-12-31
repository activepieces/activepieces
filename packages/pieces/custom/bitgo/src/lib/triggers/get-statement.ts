import { bitgoAuth } from '../../';
import {
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bitgoAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://cloud.activepieces.com/api/v1/webhooks/aHlEaNLc6vcF1nY2XJ2ed/sync',
      headers: {
        authorization: auth.secret_text,
      },
    };
    const res = await httpClient.sendRequest<{ statements: unknown[] }>(request);
    return res.body.statements.map((statement) => ({
      epochMilliSeconds: dayjs().valueOf(),
      data: statement,
    }));
  },
};

export const getStatement = createTrigger({
  auth: bitgoAuth,
  name: 'getStatement',
  displayName: 'Get Statement',
  description: 'Triggers when a new statement is fetched.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
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
    return await pollingHelper.poll(polling, context);
  },
});