import { createAction, Property, PieceAuth } from "@activepieces/pieces-framework";
import { wootricAuth, wootricAccessToken, WOOTRIC_API_URL } from "../../";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

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
    props: {
        emails: Property.Array({
            displayName: 'Emails',
            description: 'End user emails, where you want the survey to be recieved',
            required: true,
            defaultValue: []
        }),
        surveyImmediately: Property.Checkbox({
            displayName: 'Survey Immediately',
            description: 'Enter "true" to survey immediately to bypass checks, otherwise "false"',
            required: true
        })
    },
    async run(context) {
        const { username, password } = context.auth;
        const { surveyImmediately, emails } = context.propsValue;
        let surveyResponse;

        let surveyRequestPayload = {
            emails: emails,
            survey_immediately: surveyImmediately,
            access_token: await wootricAccessToken(username, password, context.store)
        };

        try {
            surveyResponse = await sendSurvey(surveyRequestPayload);
        }
        catch (e) {
            // try one more time with a new token
            context.store.delete('wootricAccessToken');
            surveyRequestPayload.access_token = await wootricAccessToken(username, password, context.store);
            surveyResponse = await sendSurvey(surveyRequestPayload);
        }
        return surveyResponse.body;
    },
});
