import { outlookAuth } from '../..';
import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
const BASE_URL = 'https://graph.microsoft.com/v1.0';

const polling: Polling<
  PiecePropValueSchema<typeof outlookAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    if (!auth || !auth['access_token']) {
      throw new Error('Authentication token is missing');
    }

    // Get the timestamp of the last poll (if any)
    const lastPoll = lastFetchEpochMS ?? 0;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${BASE_URL}/me/mailFolders/inbox/messages?$orderby=receivedDateTime desc&$top=10`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'json',
    };
    const res = await httpClient.sendRequest(request);
    if (res.status !== 200) {
      throw new Error(`Failed to fetch emails: ${res.body}`);
    }

    const data = res.body as { value: any[] };

    const newEmails = (data.value ?? []).filter((msg: any) => {
      const received = new Date(msg.receivedDateTime).getTime();
      return received > lastPoll;
    });

    return newEmails.map((item: any) => ({
      epochMilliSeconds: dayjs(item.receivedDateTime).valueOf(),
      data: item,
    }));
  },
};

export const newEmail = createTrigger({
  auth: outlookAuth,
  name: 'newEmail',
  displayName: 'New Email',
  description: 'Triggers when a new email is received in the inbox',
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
