import { createWebhookTrigger } from "../common/common";

export const newProject = createWebhookTrigger({
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created',
  eventType: 'project:created',
  requiresProject: false,
  sampleData: {
    id: 67890,
    name: 'New Project',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
});