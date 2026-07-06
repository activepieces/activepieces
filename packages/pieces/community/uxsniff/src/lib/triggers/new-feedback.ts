import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { uxsniffAuth } from '../../';
import { uxsniffCommon, UxsniffFeedback } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof uxsniffAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const response = await uxsniffCommon.apiCall<UxsniffFeedback[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/feedback',
      queryParams: {
        startdate: lastFetchEpochMS ? uxsniffCommon.startDateFromEpoch(lastFetchEpochMS) : undefined,
        limit: 50,
      },
    });

    const items = Array.isArray(response.body) ? response.body : [];
    return items.map((item) => ({
      epochMilliSeconds: uxsniffCommon.toEpochMillis(item.created),
      data: {
        feedback_id: item.feedback_id ?? null,
        question: item.question ?? null,
        comment: item.comment ?? null,
        rating: item.rating ?? null,
        created: item.created ?? null,
        url: item.url ?? null,
        screenshot: item.screenshot ?? null,
        visitor_id: item.visitor?.visitor_id ?? null,
        session_id: item.visitor?.session_id ?? null,
        visitor_email: item.visitor?.email ?? null,
        device: item.visitor?.device ?? null,
        country: item.visitor?.country ?? null,
        browser: item.visitor?.browser ?? null,
        browser_size: item.visitor?.browserSize ?? null,
        os: item.visitor?.os ?? null,
      },
    }));
  },
};

export const newFeedbackTrigger = createTrigger({
  auth: uxsniffAuth,
  name: 'new_feedback',
  displayName: 'New Feedback',
  description: 'Triggers when a visitor submits new feedback on your website.',
  aiMetadata: {
    description:
      'Fires when a website visitor submits new feedback via the UXsniff feedback widget. Each event represents one feedback submission and includes the question shown, the visitor\'s comment and numeric rating, the page URL, an optional screenshot, and visitor context such as email, device, browser, operating system, and country.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    feedback_id: 1,
    question: 'How would you rate your experience?',
    comment: 'Good comment',
    rating: 5,
    created: '2022-10-21 12:56:33',
    url: 'https://uxsniff.com/',
    screenshot: '',
    visitor_id: '1666355009686.mhprr8t',
    session_id: '1666355009686.6nzbnflq',
    visitor_email: 'john@doe.com',
    device: 'Desktop',
    country: 'Singapore',
    browser: 'Safari',
    browser_size: '2560x1335',
    os: 'MacOS',
  },
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
