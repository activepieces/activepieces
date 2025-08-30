import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { avomaAuth, avomaApiUrl } from "../..";

export const getMeetingRecording = createAction({
    auth: avomaAuth,
    name: 'get_meeting_recording',
    displayName: 'Get Meeting Recording',
    description: 'Returns the video and audio recording URLs for a given meeting.',
    props: {
        meeting_uuid: Property.ShortText({
            displayName: 'Meeting UUID',
            description: 'The unique ID (UUID) of the meeting.',
            required: true,
        }),
    },
    async run(context) {
        const queryParams: QueryParams = {
            meeting_uuid: context.propsValue.meeting_uuid,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${avomaApiUrl}/v1/recordings/`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
            },
            queryParams: queryParams,
        });

        return response.body;
    },
});