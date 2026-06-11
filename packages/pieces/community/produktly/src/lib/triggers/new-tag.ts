import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

const triggerProps = {};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof produktlyAuth>,
  StaticPropsValue<typeof triggerProps>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        name: string;
        backgroundColor: string;
        textColor: string;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/tags',
      queryParams: { limit: '100' },
    });
    return response.body.data.map((tag) => ({
      epochMilliSeconds: tag.id,
      data: {
        tag_id: tag.id,
        tag_name: tag.name,
        tag_background_color: tag.backgroundColor,
        tag_text_color: tag.textColor,
      },
    }));
  },
};

export const newTag = createTrigger({
  auth: produktlyAuth,
  name: 'new_tag',
  displayName: 'New Tag',
  description: 'Fires when a new tag is created in your Produktly account.',
  props: triggerProps,
  sampleData: {
    tag_id: 1,
    tag_name: 'Bug fix',
    tag_background_color: '#FF0000',
    tag_text_color: '#FFFFFF',
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
