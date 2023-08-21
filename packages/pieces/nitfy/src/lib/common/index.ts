import { Property, OAuth2PropertyValue, OAuth2Props } from "@activepieces/pieces-framework";
import { getAccessTokenOrThrow, HttpMethod, HttpMessageBody, HttpResponse, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const nitfyCommon = {
    Portfolios: Property.Dropdown({
        description: 'Nitfy Portfolio to create the task in',
        displayName: 'Portfolio',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            const authentication = auth as OAuth2PropertyValue;
            if (!authentication) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            const accessToken = authentication.access_token;
            
            const response = (await callNitfyApi<{
                subteams: {
                    id: string,
                    name: string,
                    initials: string,
                    logo: string,
                    color: string,
                    secondary_color: string,
                    is_general: boolean,
                    owner: string,
                    members: string[],
                }[],
                items: boolean,
                hasMore: boolean
            }>(HttpMethod.GET, "subteams", accessToken, undefined)).body;
            return {
                disabled: false,
                options: response.subteams.map((team) => {
                    return {
                        label: team.name,
                        value: team.id
                    }
                }),
            };
        }
    }),
    Projects: Property.Dropdown({
        description: 'Nitfy Project to create the task in',
        displayName: 'Project',
        required: true,
        refreshers: ['portfolio'],
        options: async ({ auth, portfolio }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }
            if (!portfolio) {
                return {
                    disabled: true,
                    placeholder: 'Select portfolio first',
                    options: [],
                };
            }
            const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
            const response = (await callNitfyApi<{
                data: {
                    gid: string,
                    name: string
                }[]
            }>(HttpMethod.GET, `portfolios/${portfolio}/projects`, accessToken, undefined)).body;
            return {
                disabled: false,
                options: response.data.map((project) => {
                    return {
                        label: project.name,
                        value: project.gid
                    }
                }),
            };
        }
    }),
}


// export async function getProtfolios(accessToken: string): Promise<
//     {
//         subteams: {
//             id: string,
//             name: string,
//             initials: string,
//             logo: string,
//             color: string,
//             secondary_color: string,
//             is_general: boolean,
//             owner: string,
//             members: string[],
//         }[],
//         items: boolean,
//         hasMore: boolean
//     }[]
// > {
//     const response = (await callNitfyApi<{
//         data: {
//             subteams: {
//                 id: string,
//                 name: string,
//                 initials: string,
//                 logo: string,
//                 color: string,
//                 secondary_color: string,
//                 is_general: boolean,
//                 owner: string,
//                 members: string[],
//             }[],
//             items: boolean,
//             hasMore: boolean
//         }[]
//     }>(HttpMethod.GET, "subteams", accessToken, undefined)).body;
//     return response.data;
// }

export async function callNitfyApi<T extends HttpMessageBody>(method: HttpMethod, apiUrl: string, accessToken: string, body: any | undefined): Promise<HttpResponse<T>> {
    console.log("\n\n\n" , accessToken , "\n\n\n")
    return await httpClient.sendRequest<T>({
        method: method,
        url: `https://openapi.niftypm.com/api/v1.0/${apiUrl}`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken
        },
        body: body
    })
}