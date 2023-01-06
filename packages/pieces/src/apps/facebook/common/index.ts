import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { AuthPropertyValue, DropdownOption, Property } from "../../../framework/property/prop.model";

const BASE_URL = "https://graph.facebook.com/v15.0/";


export const facebookCommon = {
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        authUrl: `https://www.facebook.com/v15.0/dialog/oauth`,
        tokenUrl: `${BASE_URL}oauth/access_token`,
        required: true,
        scope: ["public_profile", "leads_retrieval", "pages_show_list", "ads_read", "pages_read_engagement", "pages_manage_ads"]
    }),
    page: Property.Dropdown({
        required: true,
        displayName: "Select Page",
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (propsValue['authentication'] === undefined) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account',
                    options: [],
                };
            }
            const authentication = propsValue['authentication'] as AuthPropertyValue;
            const pages = await httpClient.sendRequest<{ data: { name: string, id: string, access_token: string }[] }>({
                method: HttpMethod.GET,
                url: `${BASE_URL}/me/accounts`,
                queryParams: {
                    limit: "100"
                },
                authentication: {
                    token: authentication.access_token,
                    type: AuthenticationType.BEARER_TOKEN
                }
            });
            return {
                disabled: false,
                placeholder: 'Select channel',
                options: pages.data.map((ch) => {
                    return {
                        label: ch.name,
                        value: {
                            id: ch.id,
                            access_token: ch.access_token
                        },
                    };
                }),
            };
        }
    }),
    lead_form: Property.Dropdown({
        required: true,
        displayName: "Select Form",
        refreshers: ['page'],
        options: async (propsValue) => {
            if (propsValue['page'] === undefined) {
                return {
                    disabled: true,
                    placeholder: 'Select page',
                    options: [],
                };
            }
            const pageToken = propsValue['page']['access_token'];
            const forms = await httpClient.sendRequest<{ data: { name: string, id: string, access_token: string }[] }>({
                method: HttpMethod.GET,
                url: `${BASE_URL}/me/leadgen_forms`,
                queryParams: {
                    limit: "100"
                },
                authentication: {
                    token: pageToken,
                    type: AuthenticationType.BEARER_TOKEN
                }
            });
            return {
                disabled: false,
                placeholder: 'Select channel',
                options: forms.data.map((ch) => {
                    return {
                        label: ch.name,
                        value: {
                            id: ch.id,
                            access_token: ch.access_token
                        },
                    };
                }),
            };
        }
    })
}
