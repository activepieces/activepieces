import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
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
  PiecePropValueSchema<typeof meistertaskAuth>,
  { project: unknown; section: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const tasksResponse = await makeRequest(
      HttpMethod.GET,
      `/sections/${propsValue.section}/tasks`,
      token
    );

    const tasks = tasksResponse.body || [];
    const comments: any[] = [];

    for (const task of tasks) {
      try {
        const commentsResponse = await makeRequest(
          HttpMethod.GET,
          `/tasks/${task.id}/comments`,
          token
        );
        const taskComments = commentsResponse.body || [];
        comments.push(...taskComments);
      } catch (error) {
        console.error(`Error fetching comments for task ${task.id}:`, error);
      }
    }

    return comments.map((comment: any) => ({
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
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  sampleData: {
    id: 98765432,
    task_id: 12345678,
    text: 'This is a sample comment',
    person_id: 11111111,
    created_at: '2024-01-15T11:00:00Z',
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