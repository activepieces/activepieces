import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { comfyIcuAuth } from '../../index';
import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { comfyIcuApiCall } from '../common';
import dayjs from 'dayjs';

export const newWorkflowCreatedTrigger = createTrigger({
  auth: comfyIcuAuth,
  name: 'new-workflow-created',
  displayName: 'New Workflow Created',
  description: 'Triggers when a new workflow is created.',
  type: TriggerStrategy.POLLING,
  props: {},
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
    id: 'RKhLj7NZrWL7Yhk_lzEf7',
    name: 'Test Flow',
    description: null,
    created_at: '2025-05-23T14:34:16.610Z',
    updated_at: '2025-05-23T14:35:11.052Z',
    tags: [],
    is_nsfw: false,
    visibility: 'PUBLIC',
    user_id: 'xyz',
    current_run_id: 'H8fwBSWw_SJtn4hrfbsbb',
    models: null,
    accelerator: null,
    project_id: 12297,
    deleted_at: null,
    featuredImages: [],
  },
});

const polling: Polling<
  PiecePropValueSchema<typeof comfyIcuAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth }) {
    const response = await comfyIcuApiCall({
      apiKey: auth,
      endpoint: '/workflows',
      method: HttpMethod.GET,
    });

    const workflows = response.body as {
      id: string;
      name: string;
      created_at: string;
    }[];

    return workflows.map((workflow) => {
      return {
        epochMilliSeconds: dayjs(workflow.created_at).valueOf(),
        data: workflow,
      };
    });
  },
};
