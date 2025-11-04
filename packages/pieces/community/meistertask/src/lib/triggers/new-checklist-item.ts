import { createWebhookTrigger } from "../common/common";

export const newChecklistItem = createWebhookTrigger({
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is added to a task',
  eventType: 'checklist_item:created',
  requiresProject: true,
  sampleData: {
    id: 33333,
    name: 'Review document',
    status: 0,
    task_id: 789,
    created_at: '2024-01-15T10:30:00Z',
  },
});