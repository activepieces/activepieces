import { BasicAuthPropertyValue, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
export type WordpressMedia = { id: string, title: { rendered: string } }

// TODO This needs a better description
const markdownPropertyDescription = `
Enable basic authentication for your Wordpress website by downloading and installing the plugin from this repository: https://github.com/WP-API/Basic-Auth.
`
const PAGE_HEADER = 'x-wp-totalpages';

export const wordpressCommon = {
    connection: Property.BasicAuth({
        displayName: "Connection",
        required: true,
        description: markdownPropertyDescription,
        username: Property.ShortText({
            displayName: "Username",
            required: true
        }),
        password: Property.SecretText({
            displayName: "Password",
            required: true,
        }),
    }),
    website_url: Property.ShortText({
        displayName: 'Website URL',
        required: true,
        description: "URL of the wordpress url i.e https://www.example-website.com"
    }),
    authors: Property.Dropdown({
        displayName: 'Authors',
        required: false,
        refreshers: ['connection', 'website_url'],
        options: async (props) => {
            const connection = props['connection'] as BasicAuthPropertyValue;
            const websiteUrl = props['website_url'] as string;
            if (!connection?.username || !connection?.password || !websiteUrl) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            if (!wordpressCommon.urlExists(websiteUrl.trim())) {
                return {
                    disabled: true,
                    placeholder: 'Incorrect website url',
                    options: [],
                };
            }
            const authProp: BasicAuthPropertyValue = props['connection'] as BasicAuthPropertyValue;
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `${websiteUrl.trim()}/wp-json/wp/v2/users`,
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
            totalPages: response.headers && response.headers[PAGE_HEADER] ? Number(response.headers[PAGE_HEADER]) : 0
        };
    },
    async getMedia(params: { websiteUrl: string, username: string, password: string, page: number }) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${params.websiteUrl}/wp-json/wp/v2/media`,
            queryParams: {
                page: params.page.toString()
            },
            authentication: {
                type: AuthenticationType.BASIC,
                username: params.username,
                password: params.password
            },

        };
        const response = await httpClient.sendRequest<WordpressMedia[]>(request);
        return {
            media: response.body,
            totalPages: response.headers && response.headers[PAGE_HEADER] ? Number(response.headers[PAGE_HEADER]) : 0
        };
    },
    async getTags(params: { websiteUrl: string, username: string, password: string, page: number }) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${params.websiteUrl}/wp-json/wp/v2/tags`,
            queryParams: {
                page: params.page.toString()
            },
            authentication: {
                type: AuthenticationType.BASIC,
                username: params.username,
                password: params.password
            },

        };
        const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
        return {
            tags: response.body,
            totalPages: response.headers && response.headers[PAGE_HEADER] ? Number(response.headers[PAGE_HEADER]) : 0
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
            queryParams: {
                page: params.page.toString()
            },
        };
        const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
        return {
            categories: response.body,
            totalPages: response.headers && response.headers[PAGE_HEADER] ? Number(response.headers[PAGE_HEADER]) : 0
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
