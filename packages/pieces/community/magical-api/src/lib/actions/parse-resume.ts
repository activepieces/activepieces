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
            description: 'The direct, publicly accessible URL to the resume file (PDF, DOC, or DOCX).',
            required: true,
        }),
    },
    async run(context) {
        const RESUME_PARSER_ENDPOINT = '/resume-parser';
        const apiKey = context.auth;
        const resumeUrl = context.propsValue.url;


        const initialResponse = await makeRequest(
            apiKey,
            HttpMethod.POST,
            RESUME_PARSER_ENDPOINT,
            { url: resumeUrl }
        );

        const requestId = initialResponse.data?.request_id;
        if (!requestId) {
            throw new Error('Failed to start resume parsing. No request_id received.');
        }

       
        const maxAttempts = 20; 
        const pollInterval = 3000; 

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const pollResponse = await makeRequest(
                apiKey,
                HttpMethod.POST,
                RESUME_PARSER_ENDPOINT,
                { request_id: requestId }
            );

            
            if (pollResponse.data && pollResponse.data.basic) {
                return pollResponse.data; 
            }


            await sleep(pollInterval);
        }

        throw new Error('Timeout: Resume parsing took too long to complete.');
    },
});