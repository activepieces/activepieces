import { Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest, getAccessTokenOrThrow } from "@activepieces/pieces-common";

export const googleSheetsCommon = {
    baseUrl: "https://slides.googleapis.com/v1/presentations",
    include_team_drives: Property.Checkbox({
        displayName: 'Include Team Drive Sheets',
        description: 'Determines if sheets from Team Drives should be included in the results.',
        defaultValue: false,
        required: true,
    }),
    slides_id: Property.Dropdown({
        displayName: "Slides",
        required: true,
        refreshers: ['include_team_drives'],
        options: async ({ auth, include_team_drives}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                }
            }
            const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
            const slides = (await httpClient.sendRequest<{ files: { id: string, name: string }[] }>({
                method: HttpMethod.GET,
                url: `https://www.googleapis.com/drive/v3/files`,
                queryParams: {
                    q: "mimeType='application/vnd.google-apps.presentation'",
                    includeItemsFromAllDrives: include_team_drives ? "true" : "false",
                    supportsAllDrives: "true"
                },
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: authProp['access_token'],
                }
            })).body.files;
            return {
                disabled: false,
                options: slides.map((slide: { id: string, name: string }) => {
                    return {
                        label: slide.name,
                        value: slide.id
                    }
                })
            };
        },
    }),
};