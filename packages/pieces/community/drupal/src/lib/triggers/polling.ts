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

const polling: Polling<PiecePropValueSchema<typeof drupalAuth>, { id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { website_url, username, password } = (auth as DrupalAuthType);
    // For triggers, we still use modeler_api - this would need an API key from modeler_api setup
    const api_key = 'placeholder'; // This would come from modeler_api configuration
    const body: any = {
      id: propsValue['id'],
      timestamp: lastFetchEpochMS,
    };
    const response = await httpClient.sendRequest<DrupalPollItem[]>({
      method: HttpMethod.POST,
      url: website_url + `/modeler_api/poll`,
      body: body,
      headers: {
        'x-api-key': api_key,
      },
    });
    console.debug('Poll response', response);
    return response.body.map((item) => ({
      epochMilliSeconds: item.timestamp,
      data: item,
    }));
  },
};

export const drupalPolling = createTrigger({
  auth: drupalAuth,
  name: 'drupalPolling',
  displayName: 'Polling',
  description: 'A trigger that polls the Drupal site.',
  props: {
    id: Property.ShortText({
      displayName: 'Polling ID',
      description: 'The ID of the polling, make sure this is unique.',
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

interface DrupalPollItem {
  data: any;
  timestamp: number;
}
