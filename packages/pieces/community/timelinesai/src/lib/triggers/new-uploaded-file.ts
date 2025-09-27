import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { timelinesaiAuth } from '../common/auth';
import { newUploadedFile as newUploadedFileProps } from '../common/properties';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { timelinesaiCommon } = await import('../common/client');

    const isTest = lastFetchEpochMS === 0;

    let files: any[] = [];

    if (propsValue.chat_id) {
      files = await timelinesaiCommon.getFiles({
        auth,
        chatId: propsValue.chat_id,
        limit: isTest ? 10 : 50,
      }) as any[];
    } else if (propsValue.whatsapp_account_id) {
      const chats = await timelinesaiCommon.getChats({
        auth,
        whatsapp_account_id: propsValue.whatsapp_account_id,
        limit: 20,
      }) as any[];

      for (const chat of chats) {
        const chatFiles = await timelinesaiCommon.getFiles({
          auth,
          chatId: chat.id,
          limit: isTest ? 5 : 10,
        }) as any[];
        files.push(...chatFiles);
      }
    }

    const uploadedFiles = files.filter((file: any) => {
      const uploadedAfterLastFetch = !lastFetchEpochMS || new Date(file.created_at).getTime() > lastFetchEpochMS;
      return isTest || uploadedAfterLastFetch;
    });

    return uploadedFiles.map((file: any) => ({
      epochMilliSeconds: new Date(file.created_at).getTime(),
      data: file,
    }));
  },
};

export const newUploadedFile = createTrigger({
  auth: timelinesaiAuth,
  name: 'newUploadedFile',
  displayName: 'New Uploaded File',
  description: 'Fires when a new file is uploaded in a chat',
  props: newUploadedFileProps(),
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'file_123',
    chat_id: 'chat_456',
    filename: 'document.pdf',
    file_url: 'https://example.com/files/document.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf',
    created_at: '2024-01-01T12:00:00Z',
  },
});
