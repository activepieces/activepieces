import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common"

export const googleBussinessCommon = {
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/business.manage"]
    }),
    location: Property.Dropdown({
        displayName: "Location",
        required: true,
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                }
            }
            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
            const response = await httpClient.sendRequest<{ locations: { title: string, name: string }[] }>({
                url: "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/*/locations",
                method: HttpMethod.GET,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp.access_token
                }
            });

            return {
                disabled: false,
                options: response.body.locations.map((location: { title: string, name: string }) => {
                    return {
                        label: location.title,
                        value: location.name
                    }
                })
            };
        }
    }),
}


