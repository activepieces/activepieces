import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const facebookLeadsCommon = {
    baseUrl: 'https://graph.facebook.com',

    authentication: Property.OAuth2({
        displayName: 'Authentication',
        description: '',
        authUrl: "https://graph.facebook.com/oauth/authorize",
        tokenUrl: "https://graph.facebook.com/oauth/access_token",
        required: true,
        scope: ['pages_show_list', 'pages_manage_ads', 'leads_retrieval', 'pages_manage_metadata'],
    }),

    page: Property.Dropdown({
        displayName: 'Page',
        required: true,
        refreshers: ['authentication'],
        options: async (props) => {
            if (!props['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect your account'
                }
            }

            try {
                const authProp: OAuth2PropertyValue = props['authentication'] as OAuth2PropertyValue;
                const pages: any[] = (await facebookLeadsCommon.getPages(authProp.access_token)).map((page: FacebookPage) => {
                    return {
                        label: page.name,
                        value: {
                            id: page.id,
                            accessToken: page.access_token
                        }
                    }
                });

                return {
                    options: pages,
                    placeholder: 'Choose a page'
                }
            }
            catch (e) {
                console.debug(e);
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect your account'
                }
            }
        },
    }),

    form: Property.Dropdown({
        displayName: 'Form',
        required: false,
        refreshers: ['page'],
        options: async (props) => {
            if (!props['page']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Choose a page'
                }
            }

            try {
                const page = props['page'] as FacebookPageDropdown
                const forms: any[] = (await facebookLeadsCommon.getPageForms(page.id, page.accessToken)).map((form: FacebookForm) => {
                    return {
                        label: form.name,
                        value: form.id
                    }
                });

                forms.unshift({
                    label: 'All Forms (Default)',
                    value: undefined
                })

                return {
                    options: forms,
                    placeholder: 'Choose a form'
                }
            }
            catch (e) {
                console.debug(e);
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Choose a page'
                }
            }
        },
    }),

    subscribePageToApp: async (pageId: any, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${facebookLeadsCommon.baseUrl}/${pageId}/subscribed_apps`,
            body: {
                access_token: accessToken,
                subscribed_fields: ['leadgen']
            }
        }

        await httpClient.sendRequest(request);
    },

    getPages: async (accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${facebookLeadsCommon.baseUrl}/me/accounts`,
            queryParams: {
                access_token: accessToken
            }
        }

        const response = await httpClient.sendRequest(request);
        return response.body.data;
    },

    getPageForms: async (pageId: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${facebookLeadsCommon.baseUrl}/${pageId}/leadgen_forms`,
            queryParams: {
                access_token: accessToken
            }
        }

        const response = await httpClient.sendRequest(request);
        return response.body.data;
    },
}

export interface FacebookOAuth2 {
    access_token: string
    expires_in: number
    claimed_at: number
    scope: string
    client_id: string
    token_type: string
    data: object
    authorization_method: string
    code: string
    type: string
    redirect_url: string
    token_url: string
}

export interface FacebookPage {
    id: string
    name: string
    category: string
    category_list: string[]
    access_token: string
    tasks: string[]
}

export interface FacebookPageDropdown {
    id: string
    accessToken: string
}

export interface FacebookForm {
    id: string
    locale: string
    name: string
    status: string
}