import { createWebhookTrigger } from "../common/common";

export const newSection = createWebhookTrigger({
  name: 'new_section',
  displayName: 'New Section',
  description: 'Triggers when a new section is created',
  eventType: 'section:created',
  requiresProject: true,
  sampleData: {
    id: 54321,
    name: 'To Do',
    project_id: 67890,
    sequence: 1,
    created_at: '2024-01-15T10:30:00Z',
  },
});