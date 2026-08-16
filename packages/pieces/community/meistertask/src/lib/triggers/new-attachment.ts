import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';

const newAttachmentPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { task_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);
    const tasksResponse = await makeRequest(
      HttpMethod.GET,
      `/tasks/${propsValue.task_id}/attachments`,
      token
    );

    const taskAttachments = Array.isArray(tasksResponse.body) ? tasksResponse.body : [];

    return taskAttachments.map((attachment: any) => ({
      epochMilliSeconds: dayjs(attachment.created_at).valueOf(),
      data: attachment,
    }));
  },
};

export const newAttachment = createTrigger({
  auth: meistertaskAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when a new attachment is added to a task.',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    task_id: meisterTaskCommon.task_id,
  },
  sampleData: {
    "id": 1,
    "task_id": 15,
    "name": "sample.pdf",
    "attachment_url": "https://www.meistertask.com/attachments/1",
    "created_at": "2023-01-01T00:00:00.000Z"
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
