import { createTrigger, Property, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { confluenceAuth } from '../..';
import dayjs from 'dayjs';

interface ConfluencePage {
  id: string;
  status: string;
  title: string;
  spaceId: string;
  createdAt: string;
  version: {
    number: number;
    createdAt: string;
  }
}

type Props = {
  spaceKey: string;
};

const polling: Polling<PiecePropValueSchema<typeof confluenceAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    const res = await httpClient.sendRequest<{ results: ConfluencePage[] }>({
      method: HttpMethod.GET,
      url: `${auth.confluenceDomain}/wiki/api/v2/pages`,
      queryParams: {
        'spaceId': propsValue.spaceKey,
        'createdAt.from': dayjs(lastFetchEpochMS).toISOString(),
        'sort': '-created-date',
        'limit': isTest ? '10' : '50'
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password
      }
    });

    return res.body.results.map((page) => ({
      epochMilliSeconds: new Date(page.createdAt).getTime(),
      data: page
    }));
  }
};

export const newPage = createTrigger({
  name: 'new_page',
  displayName: 'New Page',
  description: 'Triggers when a new page is created',
  auth: confluenceAuth,
  type: TriggerStrategy.POLLING,
  props: {
    spaceKey: Property.ShortText({
      displayName: 'Space Key',
      description: 'The key of the space to monitor for new pages',
      required: true
    })
  },
  sampleData: {
    parentType: "page",
    parentId: "123456",
    spaceId: "SAMPLE123",
    ownerId: "12345678abcd",
    lastOwnerId: null,
    createdAt: "2024-01-01T12:00:00.000Z",
    authorId: "12345678abcd",
    position: 1000,
    version: {
      number: 1,
      message: "Initial version",
      minorEdit: false,
      authorId: "12345678abcd",
      createdAt: "2024-01-01T12:00:00.000Z"
    },
    body: {},
    status: "current",
    title: "Sample Confluence Page",
    id: "987654321",
    _links: {
      editui: "/pages/resumedraft.action?draftId=987654321",
      webui: "/spaces/SAMPLE/pages/987654321/Sample+Confluence+Page",
      edituiv2: "/spaces/SAMPLE/pages/edit-v2/987654321",
      tinyui: "/x/abcd123"
    }
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  }
});