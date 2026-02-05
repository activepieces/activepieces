import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { skyprepAuth } from '../common/auth';
import dayjs from 'dayjs';
import { courceID } from '../common/props';

const props = {
  course_id: courceID,
};
const polling: Polling<
  AppConnectionValueForAuthProperty<typeof skyprepAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    // Fetch course progresses with "failed" status
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/get_course_progresses',
      {
        course_id: propsValue.course_id || null,
        status: 'failed',
        per_page: 100,
      }
    );

    return (response || [])
      .filter(
        (progress: any) =>
          dayjs(progress.updated_at).valueOf() > lastFetchEpochMS
      )
      .map((progress: any) => ({
        epochMilliSeconds: dayjs(progress.updated_at).valueOf(),
        data: progress,
      }));
  },
};

export const courceFailed = createTrigger({
  auth: skyprepAuth,
  name: 'courceFailed',
  displayName: 'Course Failed',
  description: 'Trigger when a user fails a course',
  props,
  sampleData: {
    id: 21869069,
    status: 'failed',
    user_id: 590143,
    user_email: 'jane@example.com',
    course_id: 50606,
    course_name: 'General Test Course',
    completion_date: '2020-11-06T00:40:18.000Z',
    updated_at: '2021-04-08T22:36:07.000Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
