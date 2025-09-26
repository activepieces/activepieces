import { createTimelinesAiTrigger } from '../common/trigger';

export const newUploadedFileTrigger = createTimelinesAiTrigger({
  name: 'new_uploaded_file',
  displayName: 'New Uploaded File',
  description: 'Fires when a new file is uploaded in a chat.',
  eventType: 'new_uploaded_file',
  sampleData: {
    uid: 'file_xyz789123',
    name: 'invoice_september.pdf',
    mimetype: 'application/pdf',
    size: 123456,
    url: 'https://timelines.ai/files/temp/xyz789123/invoice_september.pdf',
    chat: {
      id: 'chat_123456789',
    },
  },
});
