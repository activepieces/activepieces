import { AuthenticationType, BasicAuthPropertyValue, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";

export type WordpressMedia = { id: string, title: { rendered: string } }

export type WordpressConnection = {
    website_url: string,
    username: string;
    password: string;
}

// TODO This needs a better description
const markdownPropertyDescription = `
To use this piece, your Wordpress website needs basic authentication. However, Wordpress does not support basic authentication by default. 

To enable it, please download and install the plugin available at this repository: https://github.com/WP-API/Basic-Auth
`

export const wordpressCommon = {
    connection: Property.CustomAuth({
        displayName: "Connection",
        description: markdownPropertyDescription,
        required: true,
        props: {
            website_url: Property.ShortText({
                displayName: 'Website URL',
                required: true,
                description: "URL of the wordpress url i.e https://www.example-website.com"
            }),
            username: Property.ShortText({
                displayName: "Username",
                required: true
            }),
            password: Property.SecretText({
                displayName: "Password",
                required: true,
            })
        }
    }),
    authors: Property.Dropdown({
        displayName: 'Authors',
        required: false,
        refreshers: ['connection'],
        options: async (props) => {
            const connection = props['connection'] as WordpressConnection;
            if (!connection?.username || !connection?.password || !connection?.website_url) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            if (!wordpressCommon.urlExists(connection.website_url.trim())) {
                return {
                    disabled: true,
                    placeholder: 'Incorrect website url',
                    options: [],
                };
            }
            const authProp: BasicAuthPropertyValue = props['connection'] as BasicAuthPropertyValue;
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `${connection.website_url.toString().trim()}/wp-json/wp/v2/users`,
                authentication: {
                    type: AuthenticationType.BASIC,
                    username: authProp.username,
                    password: authProp.password
                }
            };
            const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
            return {
                options: response.body.map(usr => { return { value: usr.id, label: usr.name } }),
            }
        }
    }),
    async getPosts(params: { websiteUrl: string, username: string, password: string, authors: string | undefined, afterDate: string, page: number }) {
        const queryParams: Record<string, string> = {
            orderby: 'date',
            order: 'desc',
            before: (new Date()).toISOString(),
            after: params.afterDate,
            page: params.page.toString()
        };
        if (params.authors) {
            queryParams['author'] = params.authors;
        }
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${params.websiteUrl}/wp-json/wp/v2/posts`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: params.username,
                password: params.password
            },
            queryParams: queryParams
        };
        const response = await httpClient.sendRequest<{ date: string }[]>(request);
        return {
            posts: response.body,
            totalPages: response.headers && response.headers['X-WP-TotalPages'] ? Number(response.headers['X-WP-TotalPages']) : 0
        };
    },
    async getMedia(params: { websiteUrl: string, username: string, password: string, page: number }) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${params.websiteUrl}/wp-json/wp/v2/media`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: params.username,
                password: params.password
            },

        };
        const response = await httpClient.sendRequest<WordpressMedia[]>(request);
        return {
            media: response.body,
            totalPages: response.headers && response.headers['X-WP-TotalPages'] ? Number(response.headers['X-WP-TotalPages']) : 0
        };
    },
    async getTags(params: { websiteUrl: string, username: string, password: string, page: number }) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${params.websiteUrl}/wp-json/wp/v2/tags`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: params.username,
                password: params.password
            },

        };
        const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
        return {
            tags: response.body,
            totalPages: response.headers && response.headers['X-WP-TotalPages'] ? Number(response.headers['X-WP-TotalPages']) : 0
        };
    },
    async getCategories(params: { websiteUrl: string, username: string, password: string, page: number }) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${params.websiteUrl}/wp-json/wp/v2/categories`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: params.username,
                password: params.password
            },

        };
        const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
        return {
            categories: response.body,
            totalPages: response.headers && response.headers['X-WP-TotalPages'] ? Number(response.headers['X-WP-TotalPages']) : 0
        };
    },
    async urlExists(url: string) {
        try {
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: url
            };
            await httpClient.sendRequest(request);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
