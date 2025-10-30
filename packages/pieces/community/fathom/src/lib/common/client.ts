import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from "@activepieces/pieces-framework";

export const BASE_URL = `https://api.fathom.ai/external/v1`;

export async function makeRequest(
    apiKey: string,
    method: HttpMethod,
    path: string,
    body?: unknown
) {
    try {
        const response = await httpClient.sendRequest({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                'X-Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body,
        });
        return response.body;
    } catch (error: any) {
        throw new Error(`Unexpected error: ${error.message || String(error)}`);
    }
}

export const recordingIdDropdown = Property.Dropdown({
    displayName: "Recording ID",
    description: "Select a recording from your Fathom meetings",
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: "Please connect your account first",
            };
        }

        try {

            const meetings = await makeRequest(auth as string, HttpMethod.GET, "/meetings");

            const options = (meetings.items || []).map((meeting: any) => ({
                label: meeting.title || `Meeting ${meeting.id}`,
                value: meeting.id,
            }));

            return {
                disabled: false,
                options,
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error loading recordings",
            };
        }
    },
});
