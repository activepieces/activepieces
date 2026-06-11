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
    audience: 'both',
    aiMetadata: { description: 'Scores how well a publicly accessible resume file (PDF/DOC/DOCX) at a given URL matches a supplied job description, returning a fit score with reasoning. Use to rank or screen candidates against a specific role. Both the resume URL and the job description are required to start a job; alternatively pass the Request ID from a prior timed-out run to retrieve that result. The call polls until scoring completes. Idempotent: re-running with the same resume and job description yields the same score.', idempotent: true },
    props: {
        url: Property.ShortText({
            displayName: 'Resume URL',
            description: 'Provide a direct URL to a publicly accessible resume file (PDF, DOC, or DOCX).',
            required: false, 
        }),
        job_description: Property.LongText({
            displayName: 'Job Description',
            description: 'Provide the job description to score the resume against.',
            required: false, 
        }),
        request_id: Property.ShortText({
            displayName: 'Request ID (for retries)',
            description: "If a previous run timed out, paste the Request ID here to get the result.",
            required: false,
        }),
    },
    async run(context) {
        const { url, job_description, request_id } = context.propsValue;
        const apiKey = context.auth;
        const RESUME_SCORE_ENDPOINT = '/resume-score';
        let requestIdToPoll = request_id;
        let response;


        if (!requestIdToPoll) {
            if (!url || !job_description) {
                throw new Error("To start a new request, you must provide both a Resume URL and a Job Description.");
            }
            response = await makeRequest(apiKey, HttpMethod.POST, RESUME_SCORE_ENDPOINT, { url, job_description });
        } else {

            response = await makeRequest(apiKey, HttpMethod.POST, RESUME_SCORE_ENDPOINT, { request_id: requestIdToPoll });
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
            const pollResponse = await makeRequest(apiKey, HttpMethod.POST, RESUME_SCORE_ENDPOINT, { request_id: requestIdToPoll });

            if (pollResponse.data?.score !== undefined) {

                return pollResponse.data;
            }
        }


        throw new Error(
            'Timeout: Resume scoring is taking longer than expected. You can check the status later with this Request ID: ' + requestIdToPoll
        );
    },
});