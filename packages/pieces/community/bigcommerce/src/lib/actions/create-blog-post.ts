
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";

export const createBlogPost = createAction({
    auth: bigcommerceAuth,
    name: 'create_blog_post',
    displayName: 'Create Blog Post',
    description: 'Creates a new blog post on your store’s blog.',

    props: {
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the blog post.',
            required: true,
        }),
        body: Property.LongText({
            displayName: 'Body (HTML)',
            description: 'The content of the blog post, in HTML format.',
            required: true,
        }),
        summary: Property.LongText({
            displayName: 'Summary',
            description: 'A short excerpt of the post.',
            required: false,
        }),
        author: Property.ShortText({
            displayName: 'Author',
            description: 'The name to display as the post author.',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'A list of tags to add to the post (e.g., "summer", "sales").',
            required: false,
        }),
        is_published: Property.Checkbox({
            displayName: 'Publish Immediately',
            description: 'If true, the article will be immediately public.',
            required: false,
            defaultValue: false,
        })
    },

    async run(context) {
        const { title, body, summary, author, tags, is_published } = context.propsValue;
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);
        
        const blogPostBody: Record<string, unknown> = {
            title,
            body,
        };

        if (summary) blogPostBody['summary'] = summary;
        if (author) blogPostBody['author'] = author;
        if (tags && (tags as string[]).length > 0) {
            blogPostBody['tags'] = tags;
        }
        if (is_published) {
            blogPostBody['is_published'] = is_published;
        }


        return await client.makeRequest(
            HttpMethod.POST,
            '/v2/blog/posts', 
            blogPostBody
        );
    },
});