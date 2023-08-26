import { HttpMethod, httpClient, getAccessTokenOrThrow, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";

export const whatsappBusinessCommon = {
    baseUrl: 'https://graph.facebook.com/v17.0',
    phoneNumber: Property.Dropdown({
        displayName: 'Phone Number',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect your account'
                }
            }

            try {
                const authObj: OAuth2PropertyValue = auth as OAuth2PropertyValue;
                const phoneNumbers: any[] = (await whatsappBusinessCommon.getPhoneNumbers(authObj)).map((phoneNumber: any) => {
                    return {
                        label: phoneNumber.verified_name,
                        value: phoneNumber.id
                    }
                });

                return {
                    options: phoneNumbers,
                    placeholder: 'Choose a phone number'
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
    template: Property.Dropdown({
        displayName: 'Template',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect your account'
                }
            }

            try {
                const authObj: OAuth2PropertyValue = auth as OAuth2PropertyValue;
                const templates: any[] = (await whatsappBusinessCommon.getTemplates(authObj)).map((template: any) => {
                    return {
                        label: template.name,
                        value: {
                            name: template.name,
                            language: template.language
                        }
                    }
                });

                return {
                    options: templates,
                    placeholder: 'Choose a template'
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

    to: Property.ShortText({
        displayName: 'To',
        description: 'The phone number you want to send the message to, with country code',
        required: true
    }),
    message: Property.LongText({
        displayName: 'Message',
        required: true
    }),

    async getTemplates<T extends []>(auth: OAuth2PropertyValue) {
        const props = auth.props as any
        const response = (await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${whatsappBusinessCommon.baseUrl}/${props['whatsappBusinessAccountId']}/message_templates`,
            queryParams: {
                access_token: auth.access_token
            }
        }));

        return response.body['data'];
    },

    async getPhoneNumbers<T extends []>(auth: OAuth2PropertyValue) {
        const props = auth.props as any
        const response = (await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${whatsappBusinessCommon.baseUrl}/${props['whatsappBusinessAccountId']}/phone_numbers`,
            queryParams: {
                access_token: auth.access_token
            }
        }));

        return response.body['data'];
    },

    sendMessage: async (accessToken: string, message: {
        whatsappNumberId: string | number,
        to: string,
        text?: string,
        template?: {
            name: string,
            language: {
                code: string
            },
            components?: [{
                type: string,
                parameters: any[]
            }]
        }
    }) => {
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${whatsappBusinessCommon.baseUrl}/${message.whatsappNumberId}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken
            },
            body: {
                messaging_product: 'whatsapp',
                to: message.to,
                type: 'template',
                template: message.template
                // text: {
                //     body: message.text
                // }
            }
        });
        return response.body;
    },

    subscribeWhatsappToApp: async (whatsappBusinessAccountId: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${whatsappBusinessCommon.baseUrl}/${whatsappBusinessAccountId}/subscribed_apps`,
            body: {
                access_token: accessToken
            }
        }

        await httpClient.sendRequest(request);
    },
}