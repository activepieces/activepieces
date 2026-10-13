import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blogAuthorDropdown, blogUrlDropdown } from '../common/props';
import { createBlogPostOutputSchema } from '../output-schemas';

export const createBlogPostAction = createAction({
	auth: hubspotAuth,
	name: 'create-blog-post',
	classification: 'WRITE',
	displayName: 'Create Blog Post',
	description: 'Creates a draft or published post on a HubSpot blog.',
	audience: 'both',
	aiMetadata: { description: 'Create a post in a HubSpot CMS (COS) blog with title, slug, body, and featured image, then optionally publish it immediately when Status is set to publish rather than draft. Each call creates a new post, so it is not idempotent.', idempotent: false },
	outputSchema: createBlogPostOutputSchema,
	props: {
		contentGroupId: blogUrlDropdown,
		authorId: blogAuthorDropdown,
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{
						label: 'Draft',
						value: 'DRAFT',
						description: 'Kept unpublished',
						icon: 'file',
					},
					{
						label: 'Publish',
						value: 'PUBLISHED',
						description: 'Live once created',
						icon: 'send',
					},
				],
			},
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			required: true,
			description: 'The last part of the post\'s URL.',
			placeholder: 'my-first-post',
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Content',
			required: true,
		}),
		meta: Property.LongText({
			displayName: 'Meta Description',
			required: true,
		}),
		imageUrl: Property.ShortText({
			displayName: 'Featured Image URL',
			placeholder: 'https://example.com/cover.png',
			required: true,
		}),
	},
	async run(context) {
		const { contentGroupId, authorId, status, slug, title, body, meta, imageUrl } =
			context.propsValue;

		const createdPost = await httpClient.sendRequest<Record<string, any>>({
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/content/api/v2/blog-posts',
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: getHubspotAccessToken(context.auth) },
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
				authentication: { type: AuthenticationType.BEARER_TOKEN, token: getHubspotAccessToken(context.auth) },
				body: {
					action: 'schedule-publish',
				},
			});
		}

		const postDetails = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/content/api/v2/blog-posts/${createdPost.body['id']}`,
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: getHubspotAccessToken(context.auth) },
		});

        return postDetails.body
	},
});
