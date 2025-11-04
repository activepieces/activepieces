import { createWebhookTrigger } from "../common/common";


export const newComment = createWebhookTrigger({
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a task',
  eventType: 'comment:created',
  requiresProject: true,
  sampleData: {
    id: 98765,
    text: 'This is a comment',
    task_id: 789,
    person_id: 12345,
    created_at: '2024-01-15T10:30:00Z',
  },
});