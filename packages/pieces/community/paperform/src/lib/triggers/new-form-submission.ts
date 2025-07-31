import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown } from '../common/props';
import dayjs from 'dayjs';

const props = {
  slug_or_id: formSlugOrIdDropdown,
};
const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { slug_or_id } = propsValue;
    const apiKey = auth as string;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('limit', '100'); // Get maximum submissions
    queryParams.append('sort', 'DESC'); // Most recent first

    // If we have a last fetch time, use it to filter results
    if (lastFetchEpochMS) {
      const afterDate = new Date(lastFetchEpochMS).toISOString();
      queryParams.append('after_date', afterDate);
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${slug_or_id}/submissions?${queryParams.toString()}`
    );

    const submissions = response.data || response;

    if (!Array.isArray(submissions)) {
      return [];
    }

    return submissions.map((submission: any) => ({
      epochMilliSeconds: dayjs(
        submission.created_at || submission.submitted_at
      ).valueOf(),
      data: submission,
    }));
  },
};

export const newFormSubmission = createTrigger({
  auth: PaperformAuth,
  name: 'newFormSubmission',
  displayName: 'New Form Submission',
  description: 'Fires when a completed form submission is received.',
  props,
  sampleData: {
    id: '12345',
    form_id: 'abc123',
    created_at: '2025-01-01T12:00:00Z',
    submitted_at: '2025-01-01T12:00:00Z',
    data: {
      field_1: 'Sample response',
      field_2: 'Another response',
      email: 'user@example.com',
    },
    meta: {
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      referer: 'https://example.com',
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue,
      files,
    });
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
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue,
      files,
    });
  },
});
