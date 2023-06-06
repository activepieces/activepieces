import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const facebookPagesCommon = {
    baseUrl: 'https://graph.facebook.com/v17.0',

    authentication: Property.OAuth2({
        displayName: 'Authentication',
        description: '',
        authUrl: "https://graph.facebook.com/oauth/authorize?",
        tokenUrl: "https://graph.facebook.com/oauth/access_token",
        required: true,
        scope: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'],
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
                const pages: any[] = (await facebookPagesCommon.getPages(authProp.access_token)).map((page: FacebookPage) => {
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

    message: Property.LongText({
        displayName: 'Message',
        required: true
    }),
    link: Property.ShortText({
        displayName: 'Link',
        required: false
    }),

    caption: Property.LongText({
        displayName: 'Caption',
        required: false
    }),
    photo: Property.ShortText({
        displayName: 'Photo',
        description: 'A URL we can access for the photo',
        required: true
    }),

    title: Property.ShortText({
        displayName: 'Title',
        required: false
    }),
    description: Property.LongText({
        displayName: 'Description',
        required: false,
    }),
    video: Property.ShortText({
        displayName: 'Video',
        description: 'A URL we can access for the video (Limit: 1GB or 20 minutes)',
        required: true
    }),

    getPages: async (accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${facebookPagesCommon.baseUrl}/me/accounts?access_token=${accessToken}`,
        }

        const response = await httpClient.sendRequest(request);

        return response.body.data;
    },

    createPost: async (page: FacebookPageDropdown, message: string, link: string | undefined) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${facebookPagesCommon.baseUrl}/${page.id}/feed`,
            body: {
                access_token: page.accessToken,
                message: message,
                link: link
            }
        }

        const response = await httpClient.sendRequest(request);

        return response.body;
    },

    createPhotoPost: async (page: FacebookPageDropdown, caption: string | undefined, photo: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${facebookPagesCommon.baseUrl}/${page.id}/photos`,
            body: {
                access_token: page.accessToken,
                url: photo,
                caption: caption
            }
        }

        const response = await httpClient.sendRequest(request);

        return response.body;
    },

    createVideoPost: async (page: FacebookPageDropdown, title: string | undefined, description: string | undefined, video: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${facebookPagesCommon.baseUrl}/${page.id}/videos`,
            body: {
                access_token: page.accessToken,
                title: title,
                description: description,
                file_url: video
            }
        }

        const response = await httpClient.sendRequest(request);

        return response.body;
    },
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