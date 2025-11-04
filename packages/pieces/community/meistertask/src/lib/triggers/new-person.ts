import { createWebhookTrigger } from "../common/common";

export const newPerson = createWebhookTrigger({
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is added to a project',
  eventType: 'person:created',
  sampleData: {
    id: 12345,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    project_id: 67890,
    created_at: '2024-01-15T10:30:00Z',
  },
});