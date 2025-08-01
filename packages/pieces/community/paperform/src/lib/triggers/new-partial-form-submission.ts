import {
  createTrigger,
  TriggerStrategy,
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
    queryParams.append('limit', '100'); // Get maximum partial submissions
    queryParams.append('sort', 'DESC'); // Most recent first

    // If we have a last fetch time, use it to filter results
    if (lastFetchEpochMS) {
      const afterDate = new Date(lastFetchEpochMS).toISOString();
      queryParams.append('after_date', afterDate);
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${slug_or_id}/partial-submissions?${queryParams.toString()}`
    );

    // Extract partial submissions
    const partialSubmissions = response.results?.['partial-submissions'] || [];

    if (!Array.isArray(partialSubmissions)) {
      return [];
    }

    return partialSubmissions.map((submission: any) => ({
      epochMilliSeconds: dayjs(
        submission.created_at ||
          submission.created_at_utc ||
          submission.updated_at ||
          submission.updated_at_utc
      ).valueOf(),
      data: submission,
    }));
  },
};

export const newPartialFormSubmission = createTrigger({
  auth: PaperformAuth,
  name: 'newPartialFormSubmission',
  displayName: 'New Partial Form Submission',
  description: 'Fires when a partial/in-progress submission is received.',
  props,
  sampleData: {
    id: '5d40fdaf174b4c0007043072',
    form_id: '5d40fdaf174b4c0007043072',
    data: {
      name: 'John Doe',
      email: 'user@example.com',
      phone: '555-0123',
    },
    last_answered: 'email',
    submitted_at: '2019-04-14T09:00:00.000Z',
    updated_at: '2019-04-14T09:00:00.000Z',
    created_at: '2019-04-14T09:00:00.000Z',
    account_timezone: 'America/New_York',
    submitted_at_utc: '2019-04-14T09:00:00.000Z',
    created_at_utc: '2019-04-14T09:00:00.000Z',
    updated_at_utc: '2019-04-14T09:00:00.000Z',
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
