import { createWebhookTrigger } from '../common/common';

export const newAttachment = createWebhookTrigger({
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an attachment is created',
  eventType: 'attachment:created',
  requiresProject: true,
  sampleData: {
    id: 123456,
    name: 'document.pdf',
    url: 'https://example.com/document.pdf',
    task_id: 789,
    created_at: '2024-01-15T10:30:00Z',
  }
})