import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const contactIdDropdown = Property.Dropdown({
    displayName: 'Contact',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Connect your account first'
            }
        }

        const response = await httpClient.sendRequest<{
            items: {
                data: {
                    id: number;
                    name: string;
                }
            }[]
        }> ({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/contacts`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth as string,
            },
        });

        return {
            disabled: false,
            options: response.body.items.map(item => ({
                label: item.data.name,
                value: item.data.id
            }))
        }
    }
});

export const dealIdDropdown = Property.Dropdown({
    displayName: 'Deal',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Connect your account first'
            }
        }

        const response = await httpClient.sendRequest<{
            items: {
                data: {
                    id: number;
                    name: string;
                }
            }[]
        }> ({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/deals`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth as string,
            },
        });

        return {
            disabled: false,
            options: response.body.items.map(item => ({
                label: item.data.name,
                value: item.data.id
            }))
        }
    }
});

export const stageIdDropdown = Property.Dropdown({
    displayName: 'Stage',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Connect your account first'
            }
        }

        const response = await httpClient.sendRequest<{
            items: {
                data: {
                    id: number;
                    name: string;
                }
            }[]
        }> ({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/stages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth as string,
            },
        });

        return {
            disabled: false,
            options: response.body.items.map(item => ({
                label: item.data.name,
                value: item.data.id
            }))
        }
    }
});
