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
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const { website_url, username, password } = (auth as DrupalAuthType);
    const body: any = {
      name: propsValue['name'],
    };
    const response = await httpClient.sendRequest<DrupalPollIdItem[]>({
      method: HttpMethod.POST,
      url: website_url + `/orchestration/poll`,
      body: body,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/vnd.api+json',
      },
    });
    console.debug('Poll response', response);
    return response.body.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

export const drupalPollingId = createTrigger({
  auth: drupalAuth,
  name: 'drupalPollingId',
  displayName: 'Polling by ID',
  description: 'A trigger that polls the Drupal site by ID.',
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

interface DrupalPollIdItem {
  data: any;
  id: string;
}
