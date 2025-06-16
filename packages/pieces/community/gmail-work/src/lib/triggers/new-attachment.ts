import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { Property } from '@activepieces/pieces-framework';
import { gmailCommon } from '../common/common';


export const newAttachment = createTrigger({
  auth: gmailAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an email with an attachment is received',
  props: {
    fileTypeFilter: Property.ShortText({
      displayName: 'File Type Filter',
      description: 'Filter by file extension (e.g., "pdf" or "jpg,png,gif")',
      required: false,
    }),
    minSizeKB: Property.Number({
      displayName: 'Minimum Size (KB)',
      description: 'Minimum attachment size in KB',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await context.store.put('lastChecked', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastChecked');
  },
  run: async (context) => {
    const lastChecked = await context.store.get('lastChecked') as string;
    const checkTime = lastChecked ? new Date(lastChecked) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let query = `has:attachment after:${Math.floor(checkTime.getTime() / 1000)}`;
    if (context.propsValue.fileTypeFilter) {
      const extensions = context.propsValue.fileTypeFilter.split(',').map(ext => ext.trim());
      query += ` (${extensions.map(ext => `filename:${ext}`).join(' OR ')})`;
    }
    
    const response = await gmailCommon.makeRequest(
      context.auth.access_token,
      'GET',
      `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`
    );
    
    if (!response.messages) {
      await context.store.put('lastChecked', new Date().toISOString());
      return [];
    }
    
    const detailedMessages = await Promise.all(
      response.messages.map(async (msg: any) => {
        return gmailCommon.getMessage(context.auth.access_token, msg.id);
      })
    );
    
    // Filter by attachment size if specified
    const filteredMessages = detailedMessages.filter(msg => {
      if (!context.propsValue.minSizeKB) return true;
      
      const parts = msg.payload.parts || [];
      return parts.some((part: any) => 
        part.filename && 
        part.body && 
        part.body.size
      );
    });
    
    await context.store.put('lastChecked', new Date().toISOString());
    
    return filteredMessages.map(msg => ({
      id: msg.id,
      threadId: msg.threadId,
      attachments: msg.payload.parts?.filter((part: any) => part.filename) || [],
      ...msg,
    }));
  },
  sampleData: {
    id: 'sample_message_id',
    threadId: 'sample_thread_id',
    labelIds: ['INBOX'],
    snippet: 'Email with attachment...',
    attachments: [
      {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        body: {
          attachmentId: 'attachment_id',
          size: 1024000,
        },
      },
    ],
    payload: {
      headers: [
        { name: 'From', value: 'sender@example.com' },
        { name: 'Subject', value: 'Email with Attachment' },
        { name: 'Date', value: 'Mon, 16 Jun 2025 10:00:00 +0000' },
      ],
    },
  },
});