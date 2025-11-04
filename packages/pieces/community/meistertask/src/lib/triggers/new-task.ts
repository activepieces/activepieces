import { createWebhookTrigger } from "../common/common";

export const newTask = createWebhookTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created or changed',
  eventType: 'task:created',
  requiresProject: true,
  sampleData: {
    id: 789,
    name: 'Complete project documentation',
    notes: 'Need to add API documentation',
    section_id: 54321,
    assigned_to_id: 12345,
    status: 1,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
});