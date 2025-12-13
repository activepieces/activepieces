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
import { customgptAuth } from '../common/auth';
import { projectId } from '../common/props';
import { makeRequest } from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof customgptAuth>,
  { project_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items: any[] = [];
    const page = 1;

    const queryParams: any = {
      page: page.toString(),
      order: 'desc',
      orderBy: 'created_at',
    };

    if (lastFetchEpochMS) {
      const lastFetchDate = new Date(lastFetchEpochMS).toISOString();
      queryParams.lastUpdatedAfter = lastFetchDate;
    }

    const queryString = new URLSearchParams(queryParams).toString();

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/projects/${propsValue['project_id']}/conversations?${queryString}`
    );

    if (response.body.status === 'success' && response.body.data.data) {
      items.push(...response.body.data.data);
    }

    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newConversation = createTrigger({
  auth: customgptAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers when a new conversation is created in an agent',
  props: {
    project_id: projectId,
  },
  sampleData: {
    id: 1,
    session_id: 'f1b9aaf0-5e4e-11eb-ae93-0242ac130002',
    name: 'Conversation 1',
    project_id: 1,
    created_by: 1,
    created_at: '2023-04-30 16:43:53',
    updated_at: '2023-04-30 16:43:53',
    deleted_at: null,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
