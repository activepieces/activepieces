import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown, tagsMultiSelectDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

export const createDraftAdvancedAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_create_draft_advanced',
	displayName: 'Create Draft Advanced',
	description:
		'Create multi-post threads with full control. Supports different content and media per post using JSON format.',
	props: {
		social_set_id: socialSetDropdown,
		posts_json: Property.Json({
			displayName: 'Posts (JSON)',
			description:
				'A JSON array of post objects. Each post can have: text (string), platforms (array of strings), media_ids (array of strings). Example: [{"text": "First post"}, {"text": "Second post"}]',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Draft Title',
			description: 'An optional title for the draft.',
			required: false,
		}),
		tags: tagsMultiSelectDropdown,
		generate_share_url: Property.Checkbox({
			displayName: 'Generate Share URL',
			description: 'Generate a share URL for the draft.',
			required: false,
			defaultValue: false,
		}),
		publish_at: Property.DateTime({
			displayName: 'Publish At',
			description:
				'Schedule the draft for a specific date/time. Leave empty to save as draft.',
			required: false,
		}),
		reply_to_url: Property.ShortText({
			displayName: 'X Reply To URL',
			description: 'URL of an X post to reply to.',
			required: false,
		}),
	},
	async run(context) {
		const {
			social_set_id,
			posts_json,
			title,
			tags,
			generate_share_url,
			publish_at,
			reply_to_url,
		} = context.propsValue;

		let posts: unknown;
		if (typeof posts_json === 'string') {
			posts = JSON.parse(posts_json);
		} else {
			posts = posts_json;
		}

		if (!Array.isArray(posts)) {
			throw new Error(
				'Posts must be a JSON array of post objects. Example: [{"text": "Hello"}]',
			);
		}

		const body: Record<string, unknown> = { posts };
		if (title) body['title'] = title;
		if (tags && tags.length > 0) body['tags'] = tags;
		if (generate_share_url) body['generate_share_url'] = true;
		if (publish_at) body['publish_at'] = publish_at;
		if (reply_to_url) body['reply_to_url'] = reply_to_url;

		return await typefullyApiCall<TypefullyDraft>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/social-sets/${social_set_id}/drafts`,
			body,
		});
	},
});
