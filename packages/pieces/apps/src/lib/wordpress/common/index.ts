import { AuthenticationType, BasicAuthPropertyValue, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";

export type WordpressMedia = { id: string, title: { rendered: string } }
export const wordpressCommon = {
    connection: Property.BasicAuth({
        displayName: "Connection",
        required: true,
        description: "Username and Password",
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
        refreshers: ['connection', 'websiteUrl'],
        options: async (props) => {
            if (!props['connection']) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            if (!props['website_url']) {
                return {
                    disabled: true,
                    placeholder: 'Set your website url first',
                    options: [],
                };
            }
            if (!wordpressCommon.urlExists(props['website_url'] as string)) {
                return {
                    disabled: true,
                    placeholder: 'Incorrect website url',
                    options: [],
                };
            }
            const authProp: BasicAuthPropertyValue = props['connection'] as BasicAuthPropertyValue;
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `${props['website_url']}/wp-json/wp/v2/users`,
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
        const response = await httpClient.sendRequest<unknown[]>(request);
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
