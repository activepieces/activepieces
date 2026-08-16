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
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';

const newCommentPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { task_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);
    const tasksResponse = await makeRequest(
      HttpMethod.GET,
      `/tasks/${propsValue.task_id}/comments`,
      token
    );

    const taskComments = Array.isArray(tasksResponse.body) ? tasksResponse.body : [];
    
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
  description: 'Triggers when a new comment is added to a task.',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    task_id: meisterTaskCommon.task_id,
  },
  sampleData: {
    "id": 1,
    "task_id": 15,
    "text": "This is a comment",
    "created_at": "2023-01-01T00:00:00.000Z"
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
