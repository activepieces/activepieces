import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { magicalApiAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getProfileData = createAction({
    auth: magicalApiAuth,
    name: 'get_profile_data',
    displayName: 'Get Profile Data',
    description: 'Given a LinkedIn profile username, retrieve comprehensive profile data.',
    props: {
        profile_name: Property.ShortText({
            displayName: 'LinkedIn Profile Username',
            description: "Provide the username from the LinkedIn profile URL (e.g., 'williamhgates').",
            required: false,
        }),
        request_id: Property.ShortText({
            displayName: 'Request ID (for retries)',
            description: "If a previous run timed out, paste the Request ID here to get the result.",
            required: false,
        }),
    },
    async run(context) {
        const { profile_name, request_id } = context.propsValue;
        const apiKey = context.auth;
        const PROFILE_DATA_ENDPOINT = '/profile-data';
        let requestIdToPoll = request_id;
        let response;

        if (!requestIdToPoll) {
        
            if (!profile_name) {
                throw new Error("To start a new request, you must provide a LinkedIn Profile Username.");
            }
            response = await makeRequest(apiKey, HttpMethod.POST, PROFILE_DATA_ENDPOINT, { profile_name });
        } else {

            response = await makeRequest(apiKey, HttpMethod.POST, PROFILE_DATA_ENDPOINT, { request_id });
        }

        if (response.data?.profile) {
            return response.data;
        }

        requestIdToPoll = response.data?.request_id;
        if (!requestIdToPoll) {
            throw new Error('Failed to start or retrieve the request. The API did not return a request_id or the final data.');
        }


        const maxAttempts = 20;
        const pollInterval = 3000;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await sleep(pollInterval);
            const pollResponse = await makeRequest(apiKey, HttpMethod.POST, PROFILE_DATA_ENDPOINT, { request_id: requestIdToPoll });

            if (pollResponse.data?.profile) {
                return pollResponse.data; 
            }
        }

        throw new Error('Timeout: The request is still processing. You can try again later with this Request ID: ' + requestIdToPoll);
    },
});