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
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    if (lastItemId === undefined || lastItemId === null) {
      lastItemId = '0';
    }
    console.debug('Polling by ID', propsValue['name'], lastItemId);
    const { website_url, username, password } = auth.props;
    const body: any = {
      name: propsValue['name'],
      id: lastItemId,
    };
    const response = await httpClient.sendRequest<DrupalPollItemId[]>({
      method: HttpMethod.POST,
      url: website_url + `/orchestration/poll`,
      body: body,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/vnd.api+json',
      },
    });
    return response.body.reverse().map((item) => ({
      id: item.id,
      data: item.data,
    }));
  },
};

export const drupalPollingId = createTrigger({
  auth: drupalAuth,
  name: 'drupalPollingId',
  classification: 'READ',
  displayName: 'Poll by ID',
  description: 'Runs for each new item a named Drupal poll returns, tracked by ID.',
  aiMetadata: {
    description: 'Fires for each new item pushed to a named Drupal orchestration poll, tracked by an incrementing item ID so only items newer than the last seen ID are emitted. Fires once per new item; the poll name must match the name configured on the Drupal side (e.g. an ECA poll event).',
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

interface DrupalPollItemId {
  data: any;
  id: string;
}
