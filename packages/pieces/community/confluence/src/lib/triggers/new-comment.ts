import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { newCommentOutputSchema } from '../output-schemas';

const props = {
  spaceId: confluenceProps.spaceId({ required: true }),
  pageId: confluenceProps.pageId({ required: true }),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof confluenceAuth>,
  { spaceId?: string; pageId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const results = await confluenceApi.listPageComments({
      auth,
      pageId: propsValue.pageId,
      commentType: 'footer',
      bodyFormat: 'storage',
      sort: '-created-date',
    });

    return results
      .filter((c) => c.version.number === 1)
      .map((comment) => ({
        epochMilliSeconds: new Date(comment.version.createdAt).getTime(),
        data: comment,
      }));
  },
};

export const newCommentTrigger = createTrigger({
  name: 'new-comment',
  outputSchema: newCommentOutputSchema,
  classification: 'READ',
  displayName: 'New Comment on Page',
  description:
    'Triggers when a new footer comment is added to the selected page.',
  aiMetadata: {
    description: 'Fires when a new footer comment is added to the selected Confluence page. Each event represents one newly created top-level comment (first version); edits to existing comments and inline comments do not fire this.',
  },
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
