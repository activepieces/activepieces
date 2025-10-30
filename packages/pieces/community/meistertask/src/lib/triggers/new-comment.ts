import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getComments } from '../api';
import { projectDropdown, taskDropdown } from '../common/props';

export const newCommentTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a task',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
  },
  sampleData: {
    id: 12345,
    text: 'This is a sample comment',
    created_at: '2024-01-01T12:00:00Z',
    task_id: 67890,
    person_id: 54321,
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const comments = await getComments(auth, propsValue.task_id);
    
    const newComments = comments.filter((c: any) => {
      if (!c.created_at) return false;
      const createdAt = new Date(c.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newComments.length > 0) {
      const latestTime = Math.max(...newComments.map((c: any) => new Date(c.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newComments;
  },
});
