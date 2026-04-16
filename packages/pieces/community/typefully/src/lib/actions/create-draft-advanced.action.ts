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
		'Create multi-post threads with full control. Supports threads (multiple posts), different content and media per post with pre-uploaded media IDs using JSON format. For single posts with simple text and media URLs, use "Create Draft Simple" instead.',
	props: {
		social_set_id: socialSetDropdown,
		platforms_json: Property.Json({
			displayName: 'Platforms (JSON)',
			description: `A JSON object defining per-platform content. Each key is a platform name (x, linkedin, threads, bluesky, mastodon) with an object containing "enabled" (boolean) and "posts" (array of {text} objects). For threads/X, add multiple posts. X also supports "settings": {"reply_to_url": "..."}. Example: {"x": {"enabled": true, "posts": [{"text": "Tweet 1"}, {"text": "Tweet 2"}]}, "linkedin": {"enabled": true, "posts": [{"text": "LinkedIn post"}]}}`,
			required: true,
		}),
		draft_title: Property.ShortText({
			displayName: 'Draft Title',
			description: 'An optional title for the draft.',
			required: false,
		}),
		tags: tagsMultiSelectDropdown,
		share: Property.Checkbox({
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
	},
	async run(context) {
		const {
			social_set_id,
			platforms_json,
			draft_title,
			tags,
			share,
			publish_at,
		} = context.propsValue;

		let platforms: unknown;
		if (typeof platforms_json === 'string') {
			platforms = JSON.parse(platforms_json);
		} else {
			platforms = platforms_json;
		}

		if (typeof platforms !== 'object' || platforms === null || Array.isArray(platforms)) {
			throw new Error(
				'Platforms must be a JSON object. Example: {"x": {"enabled": true, "posts": [{"text": "Hello"}]}}',
			);
		}

		const body: Record<string, unknown> = { platforms };
		if (draft_title) body['draft_title'] = draft_title;
		if (tags && tags.length > 0) body['tags'] = tags;
		if (share) body['share'] = true;
		if (publish_at) body['publish_at'] = publish_at;

		return await typefullyApiCall<TypefullyDraft>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/social-sets/${social_set_id}/drafts`,
			body,
		});
	},
});
