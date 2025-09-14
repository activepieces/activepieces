import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { magicalApiAuth } from "../common/auth";
import { makeRequest } from "../common/client";


const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const scoreResume = createAction({
    auth: magicalApiAuth,
    name: 'score_resume',
    displayName: 'Score Resume',
    description: 'Scores a resume against a job description and provides a reason.',
    props: {
        url: Property.ShortText({
            displayName: 'Resume URL',
            description: 'The direct, publicly accessible URL to the resume file (PDF, DOC, or DOCX).',
            required: true,
        }),
        job_description: Property.LongText({
            displayName: 'Job Description',
            description: 'The job description to score the resume against.',
            required: true,
        }),
    },
    async run(context) {
        const RESUME_SCORE_ENDPOINT = '/resume-score';
        const apiKey = context.auth;
        const { url, job_description } = context.propsValue;


        const initialResponse = await makeRequest(
            apiKey,
            HttpMethod.POST,
            RESUME_SCORE_ENDPOINT,
            { 
                url: url,
                job_description: job_description 
            }
        );

        const requestId = initialResponse.data?.request_id;
        if (!requestId) {
            throw new Error('Failed to start resume scoring. No request_id received.');
        }


        const maxAttempts = 20;
        const pollInterval = 3000; 

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pollResponse = await makeRequest(
                apiKey,
                HttpMethod.POST,
                RESUME_SCORE_ENDPOINT,
                { request_id: requestId }
            );

            if (pollResponse.score !== undefined) {
                return pollResponse; 
            }

            
            await sleep(pollInterval);
        }

        throw new Error('Timeout: Resume scoring took too long to complete.');
    },
});