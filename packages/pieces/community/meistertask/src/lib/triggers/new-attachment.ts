import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getAttachments } from '../api';
import { projectDropdown, taskDropdown } from '../common/props';

export const newAttachmentTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when a new attachment is created',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
  },
  sampleData: {
    id: 12345,
    name: 'sample-document.pdf',
    source_url: 'https://example.com/document.pdf',
    created_at: '2024-01-01T12:00:00Z',
    task_id: 67890,
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const attachments = await getAttachments(auth, propsValue.task_id);
    
    const newAttachments = attachments.filter((a: any) => {
      if (!a.created_at) return false;
      const createdAt = new Date(a.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newAttachments.length > 0) {
      const latestTime = Math.max(...newAttachments.map((a: any) => new Date(a.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newAttachments;
  },
});
