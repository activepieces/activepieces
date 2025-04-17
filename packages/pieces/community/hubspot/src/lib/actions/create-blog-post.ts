import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blogAuthorDropdown, blogUrlDropdown } from '../common/props';

export const createBlogPostAction = createAction({
	auth: hubspotAuth,
	name: 'create-blog-post',
	displayName: 'Create COS Blog Post',
	description: 'Creates a blog post in you Hubspot COS blog.',
	props: {
		contentGroupId: blogUrlDropdown,
		authorId: blogAuthorDropdown,
		status: Property.StaticDropdown({
			displayName: 'Publish This Post?',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Leave As Draft',
						value: 'DRAFT',
					},
					{
						label: 'Publish Immediately',
						value: 'PUBLISHED',
					},
				],
			},
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			required: true,
			description: 'The slug of the blog post. This is the URL of the post on your COS blog.',
		}),
		title: Property.ShortText({
			displayName: 'Blog Post Title',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Blog Post Content',
			required: true,
		}),
		meta: Property.LongText({
			displayName: 'Meta Description',
			required: true,
		}),
		imageUrl: Property.ShortText({
			displayName: 'Featured Image URL',
			required: true,
		}),
	},
	async run(context) {
		const { contentGroupId, authorId, status, slug, title, body, meta, imageUrl } =
			context.propsValue;

		const createdPost = await httpClient.sendRequest<Record<string, any>>({
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/content/api/v2/blog-posts',
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth.access_token },
			body: {
				blog_author_id: authorId,
				content_group_id: contentGroupId,
				featured_image: imageUrl,
				use_featured_image: true,
				name: title,
				slug: slug,
				meta_description: meta,
				post_body: body,
				publish_immediately: status === 'PUBLISHED' ? true : undefined,
			},
		});

		if (status === 'PUBLISHED') {
			await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: `https://api.hubapi.com/content/api/v2/blog-posts/${createdPost.body['id']}/publish-action`,
				authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth.access_token },
				body: {
					action: 'schedule-publish',
				},
			});
		}

		const postDetails = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/content/api/v2/blog-posts/${createdPost.body['id']}`,
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth.access_token },
		});

        return postDetails.body
	},
});
