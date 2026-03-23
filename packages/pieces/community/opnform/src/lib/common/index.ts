import {
    Property,
    DropdownOption,
    AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
    HttpRequest,
    HttpMethod,
    AuthenticationType,
    httpClient,
} from '@activepieces/pieces-common';
import { opnformAuth } from '../auth';
import { CreateIntegrationResponse } from './types';

export const API_URL_DEFAULT = 'https://api.opnform.com';

type WorkspaceListResponse = {
    id: string;
    name: string;
}[];

type FormListResponse = {
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
    data: {
        id: string;
        title: string;
        slug?: string;
    }[];
};

export const workspaceIdProp = Property.Dropdown<string, true, typeof opnformAuth>({
    displayName: 'Workspace',
    description: 'Workspace Name',
    required: true,
    refreshers: [],
    auth: opnformAuth,
    async options({ auth }) {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect Opnform account',
                options: [],
            };
        }

        const accessToken = auth.props.apiKey;
        const options: DropdownOption<string>[] = [];

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${opnformCommon.getBaseUrl(auth)}/open/workspaces`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
        };

        const response = await httpClient.sendRequest<WorkspaceListResponse>(request);

        for (const workspace of response.body) {
            options.push({ label: workspace.name, value: workspace.id });
        }

        return {
            disabled: false,
            placeholder: 'Select workspace',
            options,
        };
    },
});

export const formIdProp = Property.Dropdown<string, true, typeof opnformAuth>({
    displayName: 'Form',
    description: 'Form Name',
    required: true,
    refreshers: ['workspaceId'],
    auth: opnformAuth,
    async options({ auth, workspaceId }) {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect Opnform account',
                options: [],
            };
        }

        if (!workspaceId) {
            return {
                disabled: true,
                placeholder: 'Select workspace',
                options: [],
            };
        }

        const accessToken = auth.props.apiKey;

        const options: DropdownOption<string>[] = [];
        let hasMore = true;
        let page = 1;

        do {
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `${opnformCommon.getBaseUrl(auth)}/open/workspaces/${workspaceId}/forms`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: accessToken,
                },
                queryParams: {
                    page: page.toString(),
                },
            };

            const response = await httpClient.sendRequest<FormListResponse>(request);

            for (const form of response.body.data) {
                options.push({ label: form.title, value: form.id });
            }

            hasMore =
                response.body.meta != undefined &&
                response.body.meta.current_page < response.body.meta.last_page;

            page++;
        } while (hasMore);

        return {
            disabled: false,
            placeholder: 'Select form',
            options,
        };
    },
});

export const opnformCommon = {
    getBaseUrl: (auth: AppConnectionValueForAuthProperty<typeof opnformAuth>) => {
        return auth.props.baseApiUrl || API_URL_DEFAULT;
    },
    validateAuth: async (auth: AppConnectionValueForAuthProperty<typeof opnformAuth>) => {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${opnformCommon.getBaseUrl(auth)}/open/workspaces`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.props.apiKey,
            },
        });
        return response.status === 200;
    },
    checkExistsIntegration: async (
        auth: AppConnectionValueForAuthProperty<typeof opnformAuth>,
        formId: string,
        flowUrl: string,
    ) => {
        // Fetch all integrations for this form
        const allIntegrations = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${opnformCommon.getBaseUrl(auth)}/open/forms/${formId}/integrations`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.props.apiKey,
            },
        });
        const integration = allIntegrations.body.find(
            (integration: any) =>
                integration.integration_id === 'activepieces' &&
                integration.data?.provider_url === flowUrl,
        );
        return integration || null;
    },
    createIntegration: async (
        auth: AppConnectionValueForAuthProperty<typeof opnformAuth>,
        formId: string,
        webhookUrl: string,
        flowUrl: string,
    ) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${opnformCommon.getBaseUrl(auth)}/open/forms/${formId}/integrations`,
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                integration_id: 'activepieces',
                status: 'active',
                data: {
                    webhook_url: webhookUrl,
                    provider_url: flowUrl,
                },
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.props.apiKey,
            },
            queryParams: {},
        };

        const response = await httpClient.sendRequest<CreateIntegrationResponse>(request);

        return response.body.form_integration.id || null;
    },
    createOrUpdateIntegration: async (
        auth: AppConnectionValueForAuthProperty<typeof opnformAuth>,
        formId: string,
        webhookUrl: string,
        flowUrl: string,
    ) => {
        // Check if the integration already exists
        const existingIntegration = await opnformCommon.checkExistsIntegration(
            auth,
            formId,
            flowUrl,
        );

        if (existingIntegration) {
            // If webhook URL matches, return existing ID
            if (existingIntegration.data?.webhook_url === webhookUrl) {
                return existingIntegration.id;
            }
            // If webhook URL differs (test -> production), delete and recreate
            await opnformCommon.deleteIntegration(auth, formId, existingIntegration.id);
        }

        // Create new integration (or recreate after deletion)
        return await opnformCommon.createIntegration(auth, formId, webhookUrl, flowUrl);
    },
    deleteIntegration: async (
        auth: AppConnectionValueForAuthProperty<typeof opnformAuth>,
        formId: string,
        integrationId: number,
    ) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${opnformCommon.getBaseUrl(
                auth,
            )}/open/forms/${formId}/integrations/${integrationId}`,
            headers: {
                'Content-Type': 'application/json',
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.props.apiKey,
            },
        };
        return await httpClient.sendRequest(request);
    },
};
