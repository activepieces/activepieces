import { createWebhookTrigger } from "../common/common";

export const newLabel = createWebhookTrigger({
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a label is created',
  eventType: 'label:created',
  requiresProject: true,
  sampleData: {
    id: 22222,
    name: 'High Priority',
    color: '#FF0000',
    project_id: 67890,
    created_at: '2024-01-15T10:30:00Z',
  },
});