import { createAction, Property } from '@activepieces/pieces-framework';
import { wootricAuth } from '../auth';
import { WOOTRIC_API_URL } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendSurvey = async (surveyRequestPayload: object) => {
  const EMAIL_SURVEY = `${WOOTRIC_API_URL}/v1/email_survey`;
  return await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: EMAIL_SURVEY,
    body: surveyRequestPayload,
  });
};

export const createWootricSurvey = createAction({
  name: 'trigger_wootric_survey',
  auth: wootricAuth,
  displayName: 'Trigger Wootric Survey',
  description: 'Trigger a survey from Wootric',
  audience: 'both',
  aiMetadata: {
    description:
      'Dispatches a Wootric (InMoment) NPS email survey to a list of end-user email addresses. Use this to send/send-out customer satisfaction surveys to specific recipients. Set survey-immediately to true to bypass Wootric eligibility/throttle checks and send right away, or false to respect them. Not idempotent: each call sends new survey emails, so repeating it re-sends to the same recipients.',
    idempotent: false,
  },
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description: 'End user emails, where you want the survey to be received',
      required: true,
      defaultValue: [],
    }),
    surveyImmediately: Property.Checkbox({
      displayName: 'Survey Immediately',
      description:
        'Enter "true" to survey immediately to bypass checks, otherwise "false"',
      required: true,
    }),
  },
  async run(context) {
    const { surveyImmediately, emails } = context.propsValue;
    const { access_token } = context.auth;

    const surveyRequestPayload = {
      emails: emails,
      survey_immediately: surveyImmediately,
      access_token: access_token,
    };

    const surveyResponse = await sendSurvey(surveyRequestPayload);

    return surveyResponse.body;
  },
});
