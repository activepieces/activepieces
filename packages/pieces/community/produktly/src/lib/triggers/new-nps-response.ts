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
import { produktlyProps } from '../common/props';

const triggerProps = {
  widget: produktlyProps.npsWidget,
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof produktlyAuth>,
  StaticPropsValue<typeof triggerProps>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        rating: string;
        comment: string;
        email: string;
        name: string;
        userId: string;
        url: string;
        language: string;
        createdAt: string;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/nps-widgets/${propsValue.widget}/responses`,
      queryParams: { limit: '100' },
    });
    return response.body.data.map((resp) => ({
      epochMilliSeconds: Date.parse(resp.createdAt),
      data: {
        response_id: resp.id,
        widget_id: propsValue.widget,
        response_rating: resp.rating,
        response_comment: resp.comment,
        response_email: resp.email,
        response_user_name: resp.name,
        response_user_id: resp.userId,
        response_url: resp.url,
        response_language: resp.language,
        response_created_at: resp.createdAt,
      },
    }));
  },
};

export const newNpsResponse = createTrigger({
  auth: produktlyAuth,
  name: 'new_nps_response',
  displayName: 'New NPS Response',
  description: 'Fires when a user submits a new NPS rating for the selected widget.',
  props: triggerProps,
  sampleData: {
    response_id: 789,
    widget_id: 1,
    response_rating: '9',
    response_comment: 'Great product, would love more integrations.',
    response_email: 'alex@example.com',
    response_user_name: 'Alex',
    response_user_id: 'user_42',
    response_url: 'https://app.example.com/settings',
    response_language: 'en',
    response_created_at: '2024-12-15T10:00:00Z',
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
