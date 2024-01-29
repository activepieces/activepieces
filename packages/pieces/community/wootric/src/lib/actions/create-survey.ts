import { createAction, Property, PieceAuth } from "@activepieces/pieces-framework";
import { wootricAuth, wootricAccessToken } from "../../";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createWootricSurvey = createAction({
    name: 'trigger_wootric_survey',
    auth: wootricAuth,
    displayName: 'Trigger Wootric Survey',
    description: 'Trigger a survey from Wootric',
    props: {
        emails: Property.ShortText({
            displayName: 'Email',
            description: 'End user email',
            required: true,
        }),
        survey_immediately: Property.ShortText({
            displayName: 'Survey Immediately',
            description: 'Enter "true" to survey immediately, otherwise "false"',
            required: true,
        })
    },
    async run({ propsValue, auth }) {
        const WOOTRIC_API_URL = "https://api.staging.wootric.com/v1/email_survey";

        const emailsString = propsValue['emails'];
        const surveyImmediately = propsValue['survey_immediately'] === 'true';
        const formData = new URLSearchParams();

        formData.append('emails[]', emailsString);
        formData.append('survey_immediately', surveyImmediately.toString());

        try {
            const { username, password } = auth;
            const data = await wootricAccessToken(username, password);
            formData.append('access_token', data['access_token']);
            const surveyResponse = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: WOOTRIC_API_URL,
                body: formData,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            console.log('Survey response:', surveyResponse);
            return surveyResponse.body;
        } catch (error) {
            console.error('Error triggering Wootric survey:', error);
            throw error;
        }
    },
});
