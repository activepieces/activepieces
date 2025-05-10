import { Property, createAction, OAuth2PropertyValue, ActionContext } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { quickbooksAuth } from "../index";
import { quickbooksCommon, QuickbooksEntityResponse } from "../lib/common";
import { QuickbooksEstimate } from "../lib/types";

type QuickBooksAuthData = OAuth2PropertyValue & {
    data: {
        realm_id: string;
        environment: string;
    }
}

export const sendEstimateAction = createAction({
    auth: quickbooksAuth,
    name: 'send_estimate',
    displayName: 'Send Estimate',
    description: 'Sends an existing estimate to a customer via email.',
    props: {
        estimateId: Property.Dropdown({
            displayName: "Estimate",
            description: "The estimate to send.",
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Connect account', options: [] }
                }
                const { access_token, data } = auth as QuickBooksAuthData;
                const { realm_id, environment } = data;
                const apiUrl = quickbooksCommon.getApiUrl(environment, realm_id);
                // Fetch estimates, including customer name for display
                const query = `SELECT Id, DocNumber, CustomerRef FROM Estimate WHERE EmailStatus != 'EmailSent' ORDERBY TxnDate DESC MAXRESULTS 1000`;
                const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksEstimate>>({
                    method: HttpMethod.GET,
                    url: `${apiUrl}/query`,
                    queryParams: { query: query, minorversion: '70' },
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.body.Fault) {
                    throw new Error(`QuickBooks API Error fetching estimates: ${response.body.Fault.Error.map((e: { Message: string; }) => e.Message).join(', ')}`);
                }

                const estimates = response.body.QueryResponse?.['Estimate'] ?? [];
                return {
                    disabled: false,
                    options: estimates.map(estimate => ({
                        // Display DocNumber and Customer Name if available
                        label: `Estimate #${estimate.DocNumber ?? estimate.Id}${estimate.CustomerRef?.name ? ' for ' + estimate.CustomerRef.name : ''}`,
                        value: estimate.Id
                    }))
                };
            }
        }),
        sendToEmail: Property.ShortText({
            displayName: "Send To Email",
            description: "The email address to send the estimate to. If left blank, QuickBooks will use the customer\'s email address.",
            required: false,
        })
    },

    async run(context: ActionContext<typeof quickbooksAuth>) {
        const { access_token, data } = context.auth;
        const { realm_id, environment } = data;
        const apiUrl = quickbooksCommon.getApiUrl(environment, realm_id);
        const props = context.propsValue;

        const estimateId = props['estimateId'];
        const emailAddress = props['sendToEmail'];

        // Construct the URL for sending the estimate
        const sendUrl = `${apiUrl}/estimate/${estimateId}/send`;

        const queryParams: { minorversion: string, sendTo?: string } = { minorversion: '70' };
        if (emailAddress) {
            queryParams.sendTo = emailAddress;
        }

        const response = await httpClient.sendRequest<{
            Estimate: QuickbooksEstimate,
            time: string,
            Fault?: { Error: { Message: string; Detail?: string; code: string; }[], type: string }
        }>({
            method: HttpMethod.POST,
            url: sendUrl,
            queryParams: queryParams,
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/octet-stream'
            },
        });

        if (response.body.Fault) {
            throw new Error(`QuickBooks API Error sending estimate: ${response.body.Fault.Error.map((e: any) => e.Message).join(', ')} - Detail: ${response.body.Fault.Error.map((e: any) => e.Detail).join(', ')}`);
        }

        return response.body.Estimate;
    },
}); 