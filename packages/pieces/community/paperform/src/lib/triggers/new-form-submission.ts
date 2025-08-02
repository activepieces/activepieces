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

    // Extract submissions from the correct nested structure
    const submissions = response.results?.submissions || response.data?.submissions || response.submissions || [];

    if (!Array.isArray(submissions)) {
      return [];
    }

    return submissions.map((submission: any) => ({
      epochMilliSeconds: dayjs(
        submission.created_at || submission.created_at_utc
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
    id: "5d40fdaf174b4c0007043072",
    form_id: "5d40fdaf174b4c0007043072",
    data: {
      "KEY": "string"
    },
    device: {
      type: "desktop",
      device: "Chrome",
      platform: "Windows",
      browser: "Chrome",
      embedded: false,
      url: "https://example.com/form",
      user_agent: "Mozilla/5.0...",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "spring_sale",
      utm_term: "form_builder",
      utm_content: "ad1",
      ip_address: "192.168.1.1"
    },
    charge: {
      products: {
        "product_1": {
          price: 29.99,
          total: 29.99,
          quantity: 1,
          summary: "Premium Plan"
        }
      },
      summary: "Premium Plan x1",
      discount: 5.00,
      discounted_subscriptions: [],
      coupon: true,
      total: 24.99,
      tax: 2.50,
      tax_percentage: 10,
      processing_fee: 0.75,
      authorize: true,
      receipt_email: "user@example.com",
      customer: {
        id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      },
      charge: "ch_1234567890",
      payment_source_id: 123,
      payment_source_service: "stripe",
      live: true
    },
    pdfs: {
      "receipt": {
        url: "https://paperform.co/pdfs/receipt.pdf",
        filename: "receipt.pdf"
      }
    },
    created_at: "2019-04-14T09:00:00.000Z",
    account_timezone: "America/Los_Angeles",
    created_at_utc: "2019-04-14T09:00:00.000Z"
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