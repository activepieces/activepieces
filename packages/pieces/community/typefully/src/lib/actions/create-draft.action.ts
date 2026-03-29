import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown, tagsMultiSelectDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

export const createDraftAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_create_draft',
	displayName: 'Create Draft',
	description:
		'Create a single-post draft with text and optional media URLs.',
	props: {
		social_set_id: socialSetDropdown,
		text: Property.LongText({
			displayName: 'Post Text',
			description: 'The text content of the post.',
			required: true,
		}),
		platforms: Property.StaticMultiSelectDropdown({
			displayName: 'Platforms',
			description: 'Which platforms to publish to. If empty, uses the social set defaults.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'X (Twitter)', value: 'x' },
					{ label: 'LinkedIn', value: 'linkedin' },
					{ label: 'Threads', value: 'threads' },
					{ label: 'Bluesky', value: 'bluesky' },
					{ label: 'Mastodon', value: 'mastodon' },
				],
			},
		}),
		title: Property.ShortText({
			displayName: 'Draft Title',
			description: 'An optional title for the draft (visible only in Typefully).',
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
			text,
			platforms,
			title,
			tags,
			generate_share_url,
			publish_at,
			reply_to_url,
		} = context.propsValue;

		const post: Record<string, unknown> = { text };
		if (platforms && platforms.length > 0) {
			post['platforms'] = platforms;
		}

		const body: Record<string, unknown> = {
			posts: [post],
		};
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
