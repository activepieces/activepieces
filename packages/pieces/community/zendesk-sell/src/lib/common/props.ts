import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from './auth';
import { callZendeskApi } from './client';


export const zendeskSellCommon = {
    lead: (required = true) => Property.Dropdown({
        auth: zendeskSellAuth,

        displayName: 'Lead',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/leads', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (error) {
                return { disabled: true, placeholder: "Error fetching leads.", options: [] };
            }
        },
    }),

    contact: (required = true) => Property.Dropdown({
        auth: zendeskSellAuth,

        displayName: 'Contact',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/contacts', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (error) {
                return { disabled: true, placeholder: "Error fetching contacts.", options: [] };
            }
        },
    }),

    tags: (resourceType: 'contact' | 'lead' | 'deal') => Property.MultiSelectDropdown({
        auth: zendeskSellAuth,
        displayName: 'Tags',
        description: 'A list of tags to associate with the record.',
        required: false,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { name: string } }[] }>(
                    HttpMethod.GET, `v2/tags?resource_type=${resourceType}`, auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.name })),
                };
            } catch (error) {
                console.error("Error fetching Zendesk Sell tags:", error);
                return { disabled: true, placeholder: "Error fetching tags.", options: [] };
            }
        },
    }),

    leadSource: () => Property.Dropdown({
        auth: zendeskSellAuth,

        displayName: 'Lead Source',
        description: 'The source of the lead.',
        required: false,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            try {
                const response = await callZendeskApi<{ items: { data: { id: number; name: string } }[] }>(
                    HttpMethod.GET, 'v2/lead_sources', auth
                );
                return {
                    disabled: false,
                    options: response.body.items.map(item => ({ label: item.data.name, value: item.data.id })),
                };
            } catch (error) {
                console.error("Error fetching Zendesk Sell lead sources:", error);
                return { disabled: true, placeholder: "Error fetching lead sources.", options: [] };
            }
        },
    }),

    deal: (required = true) => Property.Dropdown({
        auth: zendeskSellAuth,

        displayName: 'Deal',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
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
        auth: zendeskSellAuth,

        displayName: 'Company',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
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
        auth: zendeskSellAuth,

        displayName: 'Pipeline',
        required,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
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
        auth: zendeskSellAuth,

        displayName: 'Stage',
        required,
        refreshers: ['pipeline_id'],
        options: async (propsValue) => {
            const auth = propsValue.auth
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
        auth: zendeskSellAuth,

        displayName: 'Owner',
        required: false,
        refreshers: [],
        options: async (propsValue) => {
            const auth = propsValue.auth
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