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
  widget: produktlyProps.feedbackWidget,
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
        type: string;
        optionName: string;
        emoji: string;
        message: string;
        email: string;
        name: string;
        fromUrl: string;
        createdAt: string;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/feedback-widgets/${propsValue.widget}/responses`,
      queryParams: { limit: '100' },
    });
    return response.body.data.map((resp) => ({
      epochMilliSeconds: Date.parse(resp.createdAt),
      data: {
        response_id: resp.id,
        widget_id: propsValue.widget,
        response_type: resp.type,
        response_option: resp.optionName,
        response_emoji: resp.emoji,
        response_message: resp.message,
        response_email: resp.email,
        response_user_name: resp.name,
        response_from_url: resp.fromUrl,
        response_created_at: resp.createdAt,
      },
    }));
  },
};

export const newFeedbackResponse = createTrigger({
  auth: produktlyAuth,
  name: 'new_feedback_response',
  displayName: 'New Feedback Response',
  description: 'Fires when a user submits a new response to the selected feedback widget.',
  props: triggerProps,
  sampleData: {
    response_id: 456,
    widget_id: 1,
    response_type: 'positive',
    response_option: 'Love it',
    response_emoji: '😍',
    response_message: 'This is exactly what I needed!',
    response_email: 'jane@example.com',
    response_user_name: 'Jane Doe',
    response_from_url: 'https://app.example.com/dashboard',
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
