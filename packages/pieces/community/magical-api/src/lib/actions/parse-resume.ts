import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { magicalApiAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const parseResume = createAction({
    auth: magicalApiAuth,
    name: 'parse_resume',
    displayName: 'Parse Resume',
    description: 'Extract structured data (name, email, experience, skills, etc.) from a resume file.',
    props: {
        url: Property.ShortText({
            displayName: 'Resume URL',
            description: 'Provide the direct link to a publicly accessible resume file (PDF, DOC, or DOCX)',
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
        const RESUME_PARSER_ENDPOINT = '/resume-parser';
        let requestIdToPoll = request_id;
        let response;


        if (!requestIdToPoll) {
            if (!url) {
                throw new Error("To start a new request, you must provide a Resume URL.");
            }
            response = await makeRequest(apiKey, HttpMethod.POST, RESUME_PARSER_ENDPOINT, { url });
        } else {

            response = await makeRequest(apiKey, HttpMethod.POST, RESUME_PARSER_ENDPOINT, { request_id: requestIdToPoll });
        }

  
        if (response.data?.basic) {
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
            const pollResponse = await makeRequest(apiKey, HttpMethod.POST, RESUME_PARSER_ENDPOINT, { request_id: requestIdToPoll });

            if (pollResponse.data?.basic) {
                return pollResponse.data;
            }
        }


        throw new Error(
            'Timeout: Resume parsing is taking longer than expected. You can check the status later with this Request ID: ' + requestIdToPoll
        );
    },
});