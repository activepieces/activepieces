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
    audience: 'both',
    aiMetadata: { description: 'Fetches comprehensive public company data from any one of three identifiers: a company name (e.g. "Microsoft"), its LinkedIn username slug (e.g. "microsoft"), or its website URL. Use to enrich a company record when you have any of those handles. At least one identifier is required; alternatively pass the Request ID from a prior timed-out run to retrieve that result. The call polls until data is ready. Idempotent: it is a read-only lookup returning the same company for the same identifier.', idempotent: true },
    props: {
        company_name: Property.ShortText({
            displayName: 'Company Name',
            description: "Provide the company's legal name (e.g., 'Microsoft').",
            required: false,
        }),
        company_username: Property.ShortText({
            displayName: 'Company LinkedIn Username',
            description: "Provide the username from the company's LinkedIn URL (e.g., 'microsoft').",
            required: false,
        }),
        company_website: Property.ShortText({
            displayName: 'Company Website',
            description: "Provide the company's official website URL.",
            required: false,
        }),
        request_id: Property.ShortText({
            displayName: 'Request ID (for retries)',
            description: "If a previous run timed out, paste the Request ID here to get the result.",
            required: false,
        }),
    },
    async run(context) {
        const { company_name, company_username, company_website, request_id } = context.propsValue;
        const apiKey = context.auth;
        const COMPANY_DATA_ENDPOINT = '/company-data';
        let requestIdToPoll = request_id;
        let response;

        if (!requestIdToPoll) {
            if (!company_name && !company_username && !company_website) {
                throw new Error("To start a new request, you must provide a Company Name, LinkedIn Username, or Website.");
            }

            const initialBody: { [key: string]: string } = {};
            if (company_name) initialBody['company_name'] = company_name;
            if (company_username) initialBody['company_username'] = company_username;
            if (company_website) initialBody['company_website'] = company_website;

            response = await makeRequest(apiKey, HttpMethod.POST, COMPANY_DATA_ENDPOINT, initialBody);
        } else {
            response = await makeRequest(apiKey, HttpMethod.POST, COMPANY_DATA_ENDPOINT, { request_id: requestIdToPoll });
        }


        if (response.data?.company_name) {

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
            const pollResponse = await makeRequest(apiKey, HttpMethod.POST, COMPANY_DATA_ENDPOINT, { request_id: requestIdToPoll });

           
            if (pollResponse.data?.company_name) {

                return pollResponse.data;
            }
        }


        throw new Error(
            'Timeout: The request is still processing. You can try again later with this Request ID: ' + requestIdToPoll
        );
    },
});