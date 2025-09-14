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
            description: "The username from the LinkedIn profile URL (e.g., 'williamhgates' from 'linkedin.com/in/williamhgates/').",
            required: true,
        }),
    },
    async run(context) {
        const PROFILE_DATA_ENDPOINT = '/profile-data';
        const apiKey = context.auth;
        const profileName = context.propsValue.profile_name;


        const initialResponse = await makeRequest(
            apiKey,
            HttpMethod.POST,
            PROFILE_DATA_ENDPOINT,
            { profile_name: profileName }
        );

        const requestId = initialResponse.data?.request_id;
        if (!requestId) {
            throw new Error('Failed to start profile data request. No request_id received.');
        }


        const maxAttempts = 20; 
        const pollInterval = 3000; 

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pollResponse = await makeRequest(
                apiKey,
                HttpMethod.POST,
                PROFILE_DATA_ENDPOINT,
                { request_id: requestId }
            );

            
            if (pollResponse.profile) {
                return pollResponse; 
            }

            await sleep(pollInterval);
        }

        throw new Error('Timeout: Profile data retrieval took too long to complete.');
    },
});