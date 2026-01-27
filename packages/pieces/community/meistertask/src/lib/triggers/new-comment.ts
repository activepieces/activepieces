import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newCommentPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { task_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const tasksResponse = await makeRequest(
      HttpMethod.GET,
      `/task/${propsValue.task_id}/comments`,
      token
    );

    const taskComments = tasksResponse.body || [];
    
    return taskComments.map((comment: any) => ({
      epochMilliSeconds: dayjs(comment.created_at).valueOf(),
      data: comment,
    }));
  },
};

export const newComment = createTrigger({
  auth: meistertaskAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a task.',
  props: {
    task_id: meisterTaskCommon.task_id,
  },
  sampleData: {
    "id": 2,
    "task_id": 123,
    "text": "Looks awesome!",
    "text_html": "<p>Looks awesome!</p>\n",
    "person_id": 7,
    "created_at": "2017-04-02T03:14:15.926535Z",
    "updated_at": "2017-04-02T03:14:15.926535Z"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newCommentPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newCommentPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newCommentPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newCommentPolling, context);
  },
});