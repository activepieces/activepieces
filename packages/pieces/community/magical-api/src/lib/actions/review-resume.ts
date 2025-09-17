import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { magicalApiAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const reviewResume = createAction({
    auth: magicalApiAuth,
    name: 'review_resume',
    displayName: 'Review Resume',
    description: 'Analyze parsed resume using predefined criteria.',
    props: {
        url: Property.ShortText({
            displayName: 'Resume URL',
            description: 'Provide a direct URL to a publicly accessible resume file (PDF, DOC, or DOCX).',
            required: false, 
        }),
        request_id: Property.ShortText({
            displayName: 'Request ID (for retries)',
            description: "If a previous run timed out, paste the Request ID here to get the result.",
            required: false,
        }),
    },
    async run(context) {
        const { url, request_id } = context.propsValue;
        const apiKey = context.auth;
        const REVIEW_RESUME_ENDPOINT = '/resume-review';
        let requestIdToPoll = request_id;
        let response;


        if (!requestIdToPoll) {
            if (!url) {
                throw new Error("To start a new request, you must provide a Resume URL.");
            }
            response = await makeRequest(apiKey, HttpMethod.POST, REVIEW_RESUME_ENDPOINT, { url });
        } else {
    
            response = await makeRequest(apiKey, HttpMethod.POST, REVIEW_RESUME_ENDPOINT, { request_id: requestIdToPoll });
        }


        if (response.data?.score !== undefined) {
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
            const pollResponse = await makeRequest(apiKey, HttpMethod.POST, REVIEW_RESUME_ENDPOINT, { request_id: requestIdToPoll });


            if (pollResponse.data?.score !== undefined) {

                return pollResponse.data;
            }
        }


        throw new Error(
            'Timeout: Resume review is taking longer than expected. You can check the status later with this Request ID: ' + requestIdToPoll
        );
    },
});