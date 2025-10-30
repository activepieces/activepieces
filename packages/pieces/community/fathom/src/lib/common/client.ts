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
            const meetings = await makeRequest(auth as string, HttpMethod.GET, "/meetings?page_size=100");

            const items = Array.isArray(meetings?.items) ? meetings.items : [];

            const options = items.map((meeting: any) => ({
      
                label: String(meeting.title || meeting.recording_id || `Meeting ${meeting.recording_id}`),
                value: String(meeting.recording_id),
            }));

            if (options.length === 0) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "No recordings available",
                };
            }

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
