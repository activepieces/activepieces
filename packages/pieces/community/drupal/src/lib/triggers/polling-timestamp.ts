import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

const polling: Polling<PiecePropValueSchema<typeof drupalAuth>, { name: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    if (lastFetchEpochMS === undefined || lastFetchEpochMS === null) {
      lastFetchEpochMS = 0;
    }
    console.debug('Polling by timestamp', propsValue['name'], lastFetchEpochMS);
    const { website_url, username, password } = (auth as DrupalAuthType);
    const body: any = {
      name: propsValue['name'],
      timestamp: lastFetchEpochMS / 1000,
    };
    const response = await httpClient.sendRequest<DrupalPollItemTimestamp[]>({
      method: HttpMethod.POST,
      url: website_url + `/orchestration/poll`,
      body: body,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/vnd.api+json',
      },
    });
    console.debug('Poll response', response);
    console.debug('Poll response', JSON.stringify(response.body));
    return response.body.map((item) => ({
      epochMilliSeconds: item.timestamp * 1000,
      data: item.data,
    }));
  },
};

export const drupalPollingTimestamp = createTrigger({
  auth: drupalAuth,
  name: 'drupalPollingTimestamp',
  displayName: 'Polling by timestamp',
  description: 'A trigger that polls the Drupal site by timestamp.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name identifies the poll. It must be unique. It will be used to identify the poll in the Drupal site, e.g. if you use ECA to respond to this poll, you need to use the same name in the configuration of its poll event.',
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { auth, propsValue, store, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
  async onEnable(context) {
    const { auth, propsValue, store } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { auth, propsValue, store } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    const { auth, propsValue, store, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});

interface DrupalPollItemTimestamp {
  data: any;
  timestamp: number;
}
