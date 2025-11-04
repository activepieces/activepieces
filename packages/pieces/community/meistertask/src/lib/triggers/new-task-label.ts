import { createWebhookTrigger } from "../common/common";

export const newTaskLabel = createWebhookTrigger({
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a task label is created',
  eventType: 'task_label:created',
  requiresProject: true,
  sampleData: {
    id: 11111,
    task_id: 789,
    label_id: 22222,
    created_at: '2024-01-15T10:30:00Z',
  },
});