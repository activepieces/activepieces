import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newAttachmentPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown; section: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const tasksResponse = await makeRequest(
      HttpMethod.GET,
      `/sections/${propsValue.section}/tasks`,
      token
    );

    const tasks = tasksResponse.body || [];
    const attachments: any[] = [];

    for (const task of tasks) {
      try {
        const attachmentsResponse = await makeRequest(
          HttpMethod.GET,
          `/tasks/${task.id}/attachments`,
          token
        );
        const taskAttachments = attachmentsResponse.body || [];
        attachments.push(...taskAttachments);
      } catch (error) {
        console.error(`Error fetching attachments for task ${task.id}:`, error);
      }
    }

    return attachments.map((attachment: any) => ({
      epochMilliSeconds: dayjs(attachment.created_at).valueOf(),
      data: attachment,
    }));
  },
};

export const newAttachment = createTrigger({
  auth: meistertaskAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an attachment is created.',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  sampleData: {
    id: 55555555,
    task_id: 12345678,
    filename: 'document.pdf',
    url: 'https://example.com/file.pdf',
    created_at: '2024-01-15T12:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newAttachmentPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newAttachmentPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newAttachmentPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newAttachmentPolling, context);
  },
});