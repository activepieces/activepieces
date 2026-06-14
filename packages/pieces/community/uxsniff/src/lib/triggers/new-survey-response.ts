import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { uxsniffAuth } from '../../';
import { uxsniffCommon, UxsniffSurveyResponse } from '../common';

const props = {
  survey_id: uxsniffCommon.surveyDropdown,
};

type SurveyApiResponse = {
  responses?: UxsniffSurveyResponse[];
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof uxsniffAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const response = await uxsniffCommon.apiCall<SurveyApiResponse>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/survey',
      queryParams: {
        id: propsValue.survey_id,
        startdate: lastFetchEpochMS ? uxsniffCommon.startDateFromEpoch(lastFetchEpochMS) : undefined,
        limit: 100,
      },
    });

    const items = response.body.responses ?? [];
    return items.map((item) => ({
      epochMilliSeconds: uxsniffCommon.toEpochMillis(item.created),
      data: {
        response_id: item.id ?? null,
        client_id: item.client_id ?? null,
        session_id: item.session_id ?? item.sessio_id ?? null,
        answers:
          item.answers === undefined || item.answers === null
            ? null
            : typeof item.answers === 'object'
            ? JSON.stringify(item.answers)
            : String(item.answers),
        url: item.url ?? null,
        country: item.country ?? null,
        country_name: item.countryName ?? null,
        created: item.created ?? null,
        os: item.os ?? null,
        browser: item.browser ?? null,
        referrer: item.referrer ?? null,
      },
    }));
  },
};

export const newSurveyResponseTrigger = createTrigger({
  auth: uxsniffAuth,
  name: 'new_survey_response',
  displayName: 'New Survey Response',
  description: 'Triggers when a visitor submits a new response to the selected survey.',
  aiMetadata: {
    description:
      'Fires when a website visitor submits a new response to the selected UXsniff survey. Each event represents one completed survey response and includes the answers given (serialized as JSON), the page URL where the survey was answered, visitor context such as country, operating system, browser, and referrer, plus client and session identifiers.',
  },
  props,
  type: TriggerStrategy.POLLING,
  sampleData: {
    response_id: '98765',
    client_id: 'visitor_abc',
    session_id: 'session_xyz',
    answers: '{"1":"Very satisfied","2":"Found everything I needed"}',
    url: 'https://example.com/pricing',
    country: 'US',
    country_name: 'United States',
    created: '2024-05-01T10:30:00Z',
    os: 'Windows',
    browser: 'Chrome',
    referrer: 'https://google.com',
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
