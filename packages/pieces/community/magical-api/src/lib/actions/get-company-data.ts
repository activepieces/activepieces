import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { magicalApiAuth } from "../common/auth";
import { makeRequest } from "../common/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCompanyData = createAction({
    auth: magicalApiAuth,
    name: 'get_company_data',
    displayName: 'Get Company Data',
    description: 'Given a company name, LinkedIn username, or website, fetch comprehensive company info.',
    props: {
        company_name: Property.ShortText({
            displayName: 'Company Name',
            description: "The legal name of the company (e.g., 'Microsoft'). One identifier is required.",
            required: false,
        }),
        company_username: Property.ShortText({
            displayName: 'Company LinkedIn Username',
            description: "The username from the company's LinkedIn URL (e.g., 'microsoft' from 'linkedin.com/company/microsoft/'). One identifier is required.",
            required: false,
        }),
        company_website: Property.ShortText({
            displayName: 'Company Website',
            description: "The official website URL of the company (e.g., 'https://www.microsoft.com'). One identifier is required.",
            required: false,
        }),
    },
    async run(context) {
        const { company_name, company_username, company_website } = context.propsValue;

        if (!company_name && !company_username && !company_website) {
            throw new Error("You must provide at least one identifier: Company Name, Company LinkedIn Username, or Company Website.");
        }

        const initialBody: { [key: string]: string } = {};
        if (company_name) initialBody['company_name'] = company_name;
        if (company_username) initialBody['company_username'] = company_username;
        if (company_website) initialBody['company_website'] = company_website;

        const COMPANY_DATA_ENDPOINT = '/company-data';
        const apiKey = context.auth;

        const initialResponse = await makeRequest(
            apiKey,
            HttpMethod.POST,
            COMPANY_DATA_ENDPOINT,
            initialBody
        );

        // This check for an immediate response is correct and a great practice.
        if (initialResponse.company_name) {
            return initialResponse;
        }

        const requestId = initialResponse.data?.request_id;
        if (!requestId) {
            // Improved error message for clarity.
            throw new Error('Failed to start company data request. API did not return a request_id or the final data.');
        }

        const maxAttempts = 20;
        const pollInterval = 3000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Wait *before* polling to give the API time and prevent instant retries.
            await sleep(pollInterval);

            const pollResponse = await makeRequest(
                apiKey,
                HttpMethod.POST,
                COMPANY_DATA_ENDPOINT,
                { request_id: requestId }
            );

            if (pollResponse.company_name) {
                return pollResponse;
            }
        }


        throw new Error(
            'Timeout: Company data retrieval is taking longer than expected. You can check the status later using this Request ID: ' + requestId
        );
    },
});