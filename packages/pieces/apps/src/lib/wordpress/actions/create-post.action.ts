import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";
import { BasicAuthConnectionValue } from "@activepieces/shared";
import { wordpressCommon, WordpressMedia } from "../common";


export const createWordpressPost = createAction({
    name: 'create_post',
    description: 'Create a new post on Wordpress',
    displayName: 'Create Post',
    props: {
        connection: wordpressCommon.connection,
        website_url: wordpressCommon.website_url,
        title: Property.ShortText({
            description: 'Title of the post about to be added',
            displayName: 'Title',
            required: true,
        }),
        content: Property.LongText({
            description: 'Uses the WordPress Text Editor which supports HTML',
            displayName: 'Content',
            required: true
        }),
        slug: Property.ShortText({
            displayName: 'Slug',
            required: false,
        }),
        date: Property.ShortText({
            description: 'Post publish date (ISO-8601)',
            displayName: 'Date',
            required: false,
        }),
        tags: Property.Array({
            description: 'Post tags',
            displayName: 'Tags',
            required: false
        }),
        categories: Property.Array({
            description: 'Post categories',
            displayName: 'Categories',
            required: false
        }),
        featured_media: Property.Dropdown({
            description: 'Choose from one of your uploaded media files',
            displayName: 'Featured Media (image)',
            required: false,
            refreshers: ['connection', 'website_url'],
            options: async (propsValues) => {

                const connection = propsValues['connection'] as BasicAuthConnectionValue;
                if (!connection) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first'
                    }
                }
                if (!propsValues['website_url']) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please input the correct url'
                    }
                }
                if (!wordpressCommon.urlExists(propsValues['website_url'] as string)) {
                    return {
                        disabled: true,
                        placeholder: 'Incorrect website url',
                        options: [],
                    };
                }

                let pageCursor = 1;
                const getMediaParams = {
                    websiteUrl: propsValues['website_url'] as string,
                    username: connection.username,
                    password: connection.password,
                    page: pageCursor
                };
                const result: WordpressMedia[] = [];
                let media = await wordpressCommon.getMedia(getMediaParams);
                if (media.totalPages === 0) {
                    result.push(...media.media);
                }
                while (media.media.length > 0 && pageCursor <= media.totalPages) {
                    result.push(...media.media);
                    pageCursor++;
                    media = await wordpressCommon.getMedia(getMediaParams);
                }
                if (result.length === 0) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Please add an image to your media from your admin dashboard"
                    }
                }
                const options = result.map(res => {
                    return {
                        label: res.title.rendered,
                        value: res.id
                    }
                });
                return {
                    options: options,
                    disabled: false,
                }
            }
        }),
        status: Property.StaticDropdown({
            description: 'Choose post status',
            displayName: 'Status',
            required: false,
            options: {
                disabled: false, options: [
                    { value: 'publish', label: 'Published' },
                    { value: 'future', label: 'Scheduled' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'private', label: 'Private' },
                    { value: 'trash', label: 'Trash' }]
            }
        }),
        excerpt: Property.LongText({
            description: 'Uses the WordPress Text Editor which supports HTML',
            displayName: 'Excerpt',
            required: false
        }),
        meta: Property.Object({
            displayName: "Meta Fields",
            required: false
        }),
        comment_status: Property.Checkbox({
            displayName: 'Enable Comments',
            required: false
        }),
        ping_status: Property.Checkbox({
            displayName: 'Open to Pinging',
            required: false
        }),
    },
    async run(context) {
        if (!wordpressCommon.urlExists(context.propsValue.website_url)) {
            throw new Error('Website url is invalid: ' + context.propsValue.website_url);
        }
        const requestBody: Record<string, unknown> = {};
        if (context.propsValue.date) {
            requestBody['date'] = context.propsValue.date;
        }
        if (context.propsValue.comment_status !== undefined) {
            requestBody['comment_status'] = context.propsValue.comment_status ? 'open' : 'closed';
        }
        if (context.propsValue.categories) {
            requestBody['categories'] = context.propsValue.categories.filter(c => !!c);
        }
        if (context.propsValue.slug) {
            requestBody['slug'] = context.propsValue.slug;
        }
        if (context.propsValue.excerpt) {
            requestBody['excerpt'] = context.propsValue.excerpt;
        }
        if (context.propsValue.meta) {
            requestBody['meta'] = context.propsValue.meta;
        }
        if (context.propsValue.tags) {
            requestBody['tags'] = context.propsValue.tags.filter(t => !!t);
        }
        if (context.propsValue.ping_status !== undefined) {
            requestBody['ping_status'] = context.propsValue.ping_status ? 'open' : 'closed';
        }
        if (context.propsValue.status !== undefined) {
            requestBody['status'] = context.propsValue.status;
        }
        requestBody['content'] = context.propsValue.content;
        requestBody['title'] = context.propsValue.title;
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${context.propsValue.website_url}/wp-json/wp/v2/posts`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: context.propsValue.connection.username,
                password: context.propsValue.connection.password,
            },
            body: requestBody
        };
        const response = await httpClient.sendRequest<{ id: string, name: string }[]>(request);
        return await wordpressCommon.getMedia({ websiteUrl: context.propsValue.website_url, page: 1, username: context.propsValue.connection.username, password: context.propsValue.connection.username });
    }
});
