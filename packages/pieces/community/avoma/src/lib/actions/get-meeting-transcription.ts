import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { avomaAuth, avomaApiUrl } from "../..";

export const getMeetingTranscription = createAction({
    auth: avomaAuth,
    name: 'get_meeting_transcription',
    displayName: 'Get Meeting Transcription',
    description: 'Returns a single transcription for a given meeting.',
    props: {
        uuid: Property.ShortText({
            displayName: 'Transcription UUID',
            description: 'The unique ID (UUID) of the transcription.',
            required: true,
        }),
    },
    async run(context) {
        const transcriptionId = context.propsValue.uuid;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${avomaApiUrl}/v1/transcriptions/${transcriptionId}/`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
            }
        });

        return response.body;
    },
});