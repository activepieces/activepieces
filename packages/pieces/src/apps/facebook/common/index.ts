import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { AuthPropertyValue, Property } from "../../../framework/property/prop.model";

const BASE_URL = "https://www.facebook.com/v15.0/";


export const facebookCommon = {
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        authUrl: `${BASE_URL}dialog/oauth`,
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
    })
}
