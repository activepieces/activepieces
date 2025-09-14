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
            description: 'The direct, publicly accessible URL to the resume file (PDF, DOC, or DOCX) to be reviewed.',
            required: true,
        }),
    },
    async run(context) {
        const REVIEW_RESUME_ENDPOINT = '/resume-review';
        const apiKey = context.auth;
        const resumeUrl = context.propsValue.url;


        const initialResponse = await makeRequest(
            apiKey,
            HttpMethod.POST,
            REVIEW_RESUME_ENDPOINT,
            { url: resumeUrl }
        );

        const requestId = initialResponse.data?.request_id;
        if (!requestId) {
            throw new Error('Failed to start resume review. No request_id received.');
        }


        const maxAttempts = 20; 
        const pollInterval = 3000; 

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pollResponse = await makeRequest(
                apiKey,
                HttpMethod.POST,
                REVIEW_RESUME_ENDPOINT,
                { request_id: requestId }
            );


            if (pollResponse.score !== undefined && pollResponse.result) {
                return pollResponse; 
            }

           
            await sleep(pollInterval);
        }

        throw new Error('Timeout: Resume review took too long to complete.');
    },
});