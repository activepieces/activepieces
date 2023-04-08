import { Property, OAuth2PropertyValue, httpClient, HttpMethod, AuthenticationType } from "@activepieces/framework";

export const googleFormsCommon = {
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/forms.responses.readonly", "https://www.googleapis.com/auth/drive.readonly"]
    }),
    form_id: Property.Dropdown({
        displayName: "Form",
        required: true,
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder:'Please authenticate first'
                }
            }
            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
            const files = (await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `https://www.googleapis.com/drive/v3/files`,
                queryParams: {
                    q: "mimeType='application/vnd.google-apps.form'"
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                }
            })).body.files;
            return {
                disabled: false,
                options: files.map((file: { id: string, name: string }) => {
                    return {
                        label: file.name,
                        value: file.id
                    }
                })
            };
        }
    }),
}


