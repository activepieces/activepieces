import {
    AuthenticationType,
    httpClient,
    HttpMethod,
    HttpRequest,
    HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { ZendeskSellAuth } from './auth';


export async function callZendeskApi<T>(
    method: HttpMethod,
    endpoint: string,
    auth: ZendeskSellAuth,
    body?: object
): Promise<HttpResponse<T>> {

    const request: HttpRequest = {
        method: method,
        url: `https://${auth.subdomain}.zendesk.com/api/${endpoint}`,
        authentication: {
            type: AuthenticationType.BASIC,
            username: `${auth.email}/token`,
            password: auth.api_token,
        },
        body: body, 
    };

    return httpClient.sendRequest<T>(request);
}


export const zendeskSellCommon = {
    lead: (required = true) => Property.Dropdown({
        displayName: 'Lead',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET,
                    'v2/leads',
                    auth
                );
                const options = response.body.items.map(item => ({
                    label: item.data.name,
                    value: item.data.id,
                }));
                return {
                    disabled: false,
                    options: options,
                };
            } catch (error) {
                return {
                    disabled: true,
                    placeholder: "Error fetching leads.",
                    options: [],
                };
            }
        },
    }),
    
    contact: (required = true) => Property.Dropdown({
        displayName: 'Contact',
        required,
        refreshers: [],
        options: async (propsValue) => {
             const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET,
                    'v2/contacts',
                    auth
                );
                const options = response.body.items.map(item => ({
                    label: item.data.name,
                    value: item.data.id,
                }));
                return {
                    disabled: false,
                    options: options,
                };
            } catch (error) {
                return {
                    disabled: true,
                    placeholder: "Error fetching contacts.",
                    options: [],
                };
            }
        },
    }),

    tags: (resourceType: 'contact' | 'lead' | 'deal') => Property.MultiSelectDropdown({
        displayName: 'Tags',
        description: 'A list of tags to associate with the record.',
        required: false,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;

            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { name: string } }[] }>(
                    HttpMethod.GET,
                    `v2/tags?resource_type=${resourceType}`,
                    auth
                );
                
                const options = response.body.items.map(item => ({
                    label: item.data.name,
                    value: item.data.name, 
                }));

                return {
                    disabled: false,
                    options: options,
                };
            } catch (error) {
                console.error("Error fetching Zendesk Sell tags:", error);
                return {
                    disabled: true,
                    placeholder: "Error fetching tags. Check API permissions.",
                    options: [],
                };
            }
        },
    }),

    leadSource: () => Property.Dropdown({
        displayName: 'Lead Source',
        description: 'The source of the lead.',
        required: false,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;

            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET,
                    'v2/lead_sources',
                    auth
                );
                
                const options = response.body.items.map(item => ({
                    label: item.data.name,
                    value: item.data.id,
                }));

                return {
                    disabled: false,
                    options: options,
                };
            } catch (error) {
                console.error("Error fetching Zendesk Sell lead sources:", error);
                return {
                    disabled: true,
                    placeholder: "Error fetching lead sources.",
                    options: [],
                };
            }
        },
    }),

    deal: (required = true) => Property.Dropdown({
        displayName: 'Deal',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/deals', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (e) {
                return { disabled: true, placeholder: 'Error fetching deals', options: [] };
            }
        },
    }),

    company: (required = true) => Property.Dropdown({
        displayName: 'Company',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/contacts?is_organization=true', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (e) {
                return { disabled: true, placeholder: 'Error fetching companies', options: [] };
            }
        },
    }),

    pipeline: (required = true) => Property.Dropdown({ 
        displayName: 'Pipeline',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/pipelines', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (e) {
                return { disabled: true, placeholder: 'Error fetching pipelines', options: [] };
            }
        },
    }),

    stage: (required = true) => Property.Dropdown({ 
        displayName: 'Stage',
        required, 
        refreshers: ['pipeline_id'],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            const pipelineId = propsValue['pipeline_id'] as number | undefined;
            if (!auth || !pipelineId) {
                return { disabled: true, placeholder: 'Select a pipeline first', options: [] };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, `v2/pipelines/${pipelineId}/stages`, auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (e) {
                return { disabled: true, placeholder: 'Error fetching stages', options: [] };
            }
        },
    }),

    owner: () => Property.Dropdown({
        displayName: 'Owner',
        required: false,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            if (!auth) return { disabled: true, placeholder: 'Connect account first', options: [] };
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/users', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (e) {
                return { disabled: true, placeholder: 'Error fetching users', options: [] };
            }
        },
    }),
};