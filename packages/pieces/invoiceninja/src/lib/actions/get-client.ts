import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { invoiceninjaAuth } from "../..";

export const getClient = createAction({
    auth: invoiceninjaAuth,
        name: 'getclient_task',
        displayName: 'Get Client Details from e-mail',
        description: 'Gets the client details if they exist by e-mail.',

        props: {
            email: Property.LongText({
                displayName: 'Client e-mail address',
                description: 'A valid e-mail address to get client details for',
                required: true,
            }),
        },

        async run(context) {
            const INapiToken = context.auth.access_token;

            const headers = {
                'X-Api-Token': INapiToken,
            };

            const queryParams = new URLSearchParams();
            queryParams.append('email', context.propsValue.email || '');

            // Remove trailing slash from base_url
            const baseUrl = context.auth.base_url.replace(/\/$/, "");
            const url = `${baseUrl}/api/v1/clients/?${queryParams.toString()}`;
            const httprequestdata = {
                method: HttpMethod.GET,
                url,
                headers,
            };
            
            try {
                  const response = await httpClient.sendRequest(httprequestdata);
                  // Process the successful response here (status 2xx).
                  // count is the number of tickets with that number so return true if it is 1.
                  return response.body;
                  // if (response.body.meta.pagination.total>0) { return true; } else { return false; }
                } catch (error) {
                  // Handle the error when the request fails (status other than 2xx).
                  return "There was a problem getting information from your Invoice Ninja";
                }

            }
              


})
