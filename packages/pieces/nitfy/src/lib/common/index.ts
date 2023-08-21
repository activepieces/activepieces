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
            const authentication = auth as OAuth2PropertyValue;
            if (! authentication) {
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
            const accessToken = authentication.access_token;
            const response = (await callNitfyApi<{
                items:{
                    id: string,
                    nice_id: string,
                    name: string,
                    description: string, 
                    initials: string,
                    logo: string,
                    color: string,
                    secondary_color: string,
                    demo: boolean,
                    archived: boolean,
                    auto_milestones: boolean,
                    default_tasks_view: string,
                    access_type: string,
                    owner: string,
                    members: string[],
                    general_discussion: string,
                    subteam: string,
                    progress: number,
                    joined: boolean,
                    general_discussion_muted: boolean,
                    email: string,
                    zoom_id: string,
                    zoom_password: string,
                    zoom_join_url: string,
                    webex_id: string,
                    webex_password: string,
                    webex_join_url: string,
                    enabled_modules: string[],
                    disabled_modules: string[],
                    disabled_widgets: string,
                    hidden_taskboard_fields: string,
                    repo: string,
                    total_story_points: number,
                    completed_story_points: number,
                    pinned_message: string,
                    pinned_by: string,
                    completion_groups: string[],
                    doc_root_folder: object,
                    file_root_folder: object,
                    removed: boolean,
                    rollups: string[],
                    list_columns_order: string[],
                    hidden_list_columns: string[],
                    integrations: string[],
                }[],
                hasMore: boolean,
            }>(HttpMethod.GET, `projects`, accessToken, undefined)).body;
            return {
                disabled: false,
                options: response.items.map((project) => {
                    return {
                        label: project.name,
                        value: project.id
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