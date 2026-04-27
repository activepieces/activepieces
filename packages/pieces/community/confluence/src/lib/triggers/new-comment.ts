import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { confluenceAuth, confluenceAuthValue } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

interface ConfluenceComment {
  id: string;
  status: string;
  pageId: string;
  version: {
    number: number;
    createdAt: string;
  };
  body: unknown;
}

const props = {
  spaceId: spaceIdProp,
  pageId: pageIdProp,
};

const polling: Polling<
  confluenceAuthValue,
  { spaceId?: string; pageId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const response = await confluenceApiCall<
      PaginatedResponse<ConfluenceComment>
    >({
      domain: auth.props.confluenceDomain,
      username: auth.props.username,
      password: auth.props.password,
      version: 'v2',
      method: HttpMethod.GET,
      resourceUri: `/pages/${propsValue.pageId}/footer-comments`,
      query: {
        limit: '100',
        sort: '-created-date',
        'body-format': 'storage',
      },
    });

    if (isNil(response.results)) return [];

    return response.results
      .filter((c) => c.version.number === 1)
      .map((comment) => ({
        epochMilliSeconds: new Date(comment.version.createdAt).getTime(),
        data: comment,
      }));
  },
};

export const newCommentTrigger = createTrigger({
  name: 'new-comment',
  displayName: 'New Comment on Page',
  description:
    'Triggers when a new footer comment is added to the selected page.',
  auth: confluenceAuth,
  type: TriggerStrategy.POLLING,
  props,
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
  },
  sampleData: {
    id: 'c-555',
    status: 'current',
    pageId: '987654321',
    authorId: '12345678abcd',
    version: {
      number: 1,
      authorId: '12345678abcd',
      createdAt: '2024-01-02T09:10:00.000Z',
      message: '',
      minorEdit: false,
    },
    body: {
      storage: {
        value: '<p>Great page!</p>',
        representation: 'storage',
      },
    },
  },
});
