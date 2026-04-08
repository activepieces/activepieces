import {
  createTrigger,
  Property,
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
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

const polling: Polling<AppConnectionValueForAuthProperty<typeof featheryAuth>, { form_id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { form_id } = propsValue;

    const queryParams = new URLSearchParams();
    queryParams.append('form_id', form_id);
    queryParams.append('completed', 'true');

    if (lastFetchEpochMS) {
      queryParams.append('start_time', new Date(lastFetchEpochMS).toISOString());
    }

    const response = await featheryCommon.apiCall<{
      count: number;
      results: Array<{
        values: Array<{
          id: string;
          type: string;
          created_at: string;
          updated_at: string;
          value: unknown;
          hidden: boolean;
          display_text: string;
          internal_id: string;
        }>;
        user_id: string;
        submission_start: string;
        last_submitted: string;
      }>;
    }>({
      method: HttpMethod.GET,
      url: `/form/submission/?${queryParams.toString()}`,
      apiKey: auth.secret_text,
    });

    return response.results.map((submission) => ({
      epochMilliSeconds: dayjs(submission.last_submitted).valueOf(),
      data: submission,
    }));
  },
};

export const formCompletedTrigger = createTrigger({
  auth: featheryAuth,
  name: 'form_completed',
  displayName: 'Form Completed',
  description: 'Triggers when a form is completed by an end user.',
  props: {
    form_id: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to monitor for completions.',
      required: true,
      refreshers: [],
      auth: featheryAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const forms = await featheryCommon.apiCall<
          Array<{ id: string; name: string; active: boolean }>
        >({
          method: HttpMethod.GET,
          url: '/form/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: forms.map((form) => ({
            label: form.name,
            value: form.id,
          })),
        };
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    values: [
      {
        id: 'email_field',
        type: 'email',
        created_at: '2024-10-28T07:56:09.391398Z',
        updated_at: '2024-10-28T16:39:32.577794Z',
        value: 'user@example.com',
        hidden: false,
        display_text: '',
        internal_id: 'ef5ed054-73de-4463-ba61-82c36aca5afc',
      },
    ],
    user_id: '131e7132-dg6d-4a8c-9d70-cgd493c2a368',
    submission_start: '2024-10-30T02:07:32Z',
    last_submitted: '2024-10-30T02:07:32Z',
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
