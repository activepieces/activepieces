import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { cryptolensAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

interface WebAPILogEvent {
  Id: number;
  Pid?: number;
  Key?: number;
  IP: string;
  Time: string;
  State: number;
  MachineCode?: string;
  FriendlyName?: string;
}

const props = {
  productId: Property.Number({
    displayName: 'Product ID',
    description: 'Filter events for a specific product (optional)',
    required: false,
  }),
  key: Property.ShortText({
    displayName: 'License Key',
    description:
      'Filter events for a specific license key (requires Product ID)',
    required: false,
  }),
  states: Property.LongText({
    displayName: 'Event States',
    description:
      'Filter by event states (comma-separated numbers). E.g., 1010 for validation, 2010 for activation, 3010 for key creation, 6010 for deactivation',
    required: false,
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description:
      'Maximum number of events to fetch per poll (default 100, max 1000)',
    required: false,
  }),
};
const polling: Polling<
  AppConnectionValueForAuthProperty<typeof cryptolensAuth>,
  {
    productId?: number;
    key?: string;
    states?: string;
    limit?: number;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const params = new URLSearchParams();

    if (propsValue.productId) {
      params.append('ProductId', String(propsValue.productId));
    }

    if (propsValue.key && propsValue.productId) {
      params.append('Key', propsValue.key);
    }

    if (propsValue.states) {
      params.append('States', propsValue.states);
    }

    const limit = propsValue.limit || 100;
    params.append('Limit', String(limit));

    // Add time filter to get events since last fetch
    if (lastFetchEpochMS) {
      const timeFilter = JSON.stringify({
        gte: Math.floor(lastFetchEpochMS / 1000),
      });
      params.append('Time', timeFilter);
    }

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/ai/GetWebAPILog?${params.toString()}`
    );

    const responseBody: {
      result: number;
      Logs: WebAPILogEvent[];
    } = response;

    if (responseBody.result !== 0 || !responseBody.Logs) {
      return [];
    }

    return responseBody.Logs.map((log) => ({
      epochMilliSeconds: dayjs(log.Time).valueOf(),
      data: log,
    }));
  },
};

export const newApiEvent = createTrigger({
  auth: cryptolensAuth,
  name: 'newApiEvent',
  displayName: 'New API Event',
  description:
    'Trigger when a new API event is logged (activation, deactivation, key creation, etc.)',
  props,
  sampleData: {
    Id: 1,
    Pid: 2196,
    Key: 18543,
    IP: '90.227.166.132',
    Time: '2015-03-17T21:23:32.153',
    State: 2010,
    MachineCode: 'machine-code-example',
    FriendlyName: 'User Device',
  },
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
