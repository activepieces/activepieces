import {
  createTrigger,
  TriggerStrategy,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { BitlyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { groupGuidDropdown } from '../common/props';

// Define props type
const props = {
  group_guid: groupGuidDropdown,
};

// Define response types
interface BitlinkDeeplink {
  guid: string;
  bitlink: string;
  app_uri_path: string;
  install_url: string;
  app_guid: string;
  os: string;
  install_type: string;
  created: string;
  modified: string;
  brand_guid: string;
}

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const params = {
      created_after: Math.floor(lastFetchEpochMS / 1000),
      size: 50,
      archived: 'off' as const,
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/groups/${propsValue.group_guid}/bitlinks?&created_after=${params.created_after}&size=10`
    );

    return response.links.map((link: any) => ({
      epochMilliSeconds: dayjs(link.created_at).valueOf(),
      data: {
        id: link.id,
        link: link.link,
        long_url: link.long_url,
        title: link.title,
        created_at: link.created_at,
        created_by: link.created_by,
        tags: link.tags,
        deeplinks: link.deeplinks,
        qr_codes: link.qr_code_ids,
        archived: link.archived,
      },
    }));
  },
};

export const newBitlinkCreated = createTrigger({
  auth: BitlyAuth,
  name: 'newBitlinkCreated',
  displayName: 'New Bitlink Created',
  description: 'Triggers when a new Bitlink is created in the specified group',
  props,
  sampleData: {
    id: 'bit.ly/example',
    link: 'https://bit.ly/example',
    long_url: 'https://www.example.com',
    title: 'Example Link',
    created_at: '2023-07-23T12:00:00Z',
    created_by: 'user123',
    tags: ['marketing', 'social'],
    deeplinks: [],
    qr_codes: [],
    archived: false,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue,
      files,
    });
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
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue,
      files,
    });
  },
});
