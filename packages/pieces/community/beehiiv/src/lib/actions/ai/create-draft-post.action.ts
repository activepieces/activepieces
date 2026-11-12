import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const createDraftPostAiAction = createAction({
	auth: beehiivAuth,
	name: 'create_draft_post',
	classification: 'WRITE',
	displayName: 'Create Draft Post',
	description: 'Creates a draft post from HTML. It is never sent or published by this action.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a beehiiv post as a draft from a title and HTML body; it is never sent or published, a person reviews and sends it in beehiiv. Needs the beehiiv Pro or Enterprise plan (Send API). Each call creates a new draft.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.createDraftPost,
	props: {
		publication_id: aiProps.publicationId(),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		body_html: Property.LongText({
			displayName: 'Body (HTML)',
			description: 'The post body as HTML. <style> and <link> tags are removed by beehiiv.',
			required: true,
		}),
		subtitle: Property.ShortText({ displayName: 'Subtitle', required: false }),
		content_tags: Property.Array({ displayName: 'Content Tags', required: false }),
		thumbnail_image_url: Property.ShortText({ displayName: 'Thumbnail Image URL', description: 'Public https URL of the thumbnail image.', required: false }),
		post_template_id: Property.ShortText({ displayName: 'Post Template ID', description: 'Template ID from "List Post Templates".', required: false }),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const thumbnail = aiInput.optionalText(propsValue.thumbnail_image_url);
		if (thumbnail !== undefined && !thumbnail.startsWith('https://')) {
			throw new Error('Thumbnail Image URL must start with https://.');
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'POST',
			path: pathFor(['publications', publicationId, 'posts']),
			operation: 'create draft post',
			body: {
				title: aiInput.requireText({ value: propsValue.title, label: 'Title' }),
				body_content: aiInput.requireText({ value: propsValue.body_html, label: 'Body (HTML)' }),
				subtitle: aiInput.optionalText(propsValue.subtitle),
				content_tags: aiInput.textList({ value: propsValue.content_tags, label: 'Content Tags' }),
				thumbnail_image_url: thumbnail,
				post_template_id: aiInput.optionalText(propsValue.post_template_id),
				status: 'draft',
			},
		});
		const data = aiInput.dataOf(response.body);
		return { id: data['id'] ?? null, preview_url: data['preview_url'] ?? null, status: 'draft' };
	},
});
