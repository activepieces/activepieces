import {
  createTrigger,
  TriggerStrategy,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { drupalAuth } from '../auth';
import { DrupalAuthType } from '../common/jsonapi';

const polling: Polling<DrupalAuthType, { name: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    if (lastFetchEpochMS === undefined || lastFetchEpochMS === null) {
      lastFetchEpochMS = 0;
    }
    console.debug('Polling by timestamp', propsValue['name'], lastFetchEpochMS);
    const { website_url, username, password } = auth.props;
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
    return response.body.map((item) => ({
      epochMilliSeconds: item.timestamp * 1000,
      data: item.data,
    }));
  },
};

export const drupalPollingTimestamp = createTrigger({
  auth: drupalAuth,
  name: 'drupalPollingTimestamp',
  classification: 'READ',
  displayName: 'Poll by Time',
  description: 'Runs for each new item a named Drupal poll returns, by time.',
  aiMetadata: {
    description: 'Fires for each new item pushed to a named Drupal orchestration poll, tracked by timestamp so only items created after the last poll are emitted. Use the time-based variant when items are dated rather than sequentially numbered; the poll name must match the name configured on the Drupal side (e.g. an ECA poll event).',
  },
  props: {
    requirements: Property.MarkDown({
      value: 'Needs the [Drupal Orchestration](https://www.drupal.org/project/orchestration) module on your site.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Poll Name',
      description: 'A unique name; use the same one in your site\'s ECA poll event.',
      placeholder: 'new_article_poll',
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
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

interface DrupalPollItemTimestamp {
  data: any;
  timestamp: number;
}
