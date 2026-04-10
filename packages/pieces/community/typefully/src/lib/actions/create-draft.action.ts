import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown, tagsMultiSelectDropdown } from '../common/props';
import { TypefullyDraft } from '../common/types';

const PLATFORM_OPTIONS = ['x', 'linkedin', 'threads', 'bluesky', 'mastodon'] as const;
type PlatformKey = (typeof PLATFORM_OPTIONS)[number];

export const createDraftAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_create_draft',
	displayName: 'Create Draft Simple',
	description:
		'Create cross-platform, single-post drafts with text and optional media URLs. For threads (multiple posts) or advanced control, use "Create Draft Advanced" instead.',
	props: {
		social_set_id: socialSetDropdown,
		text: Property.LongText({
			displayName: 'Post Text',
			description: 'The text content of the post.',
			required: true,
		}),
		platforms: Property.StaticMultiSelectDropdown({
			displayName: 'Platforms',
			description:
				'Which platforms to publish to. At least one platform must be selected.',
			required: true,
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
		draft_title: Property.ShortText({
			displayName: 'Draft Title',
			description: 'An optional title for the draft (visible only in Typefully).',
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
			draft_title,
			tags,
			share,
			publish_at,
			reply_to_url,
		} = context.propsValue;

		const platformsBody: Record<string, unknown> = {};
		for (const platform of platforms as PlatformKey[]) {
			const platformConfig: Record<string, unknown> = {
				enabled: true,
				posts: [{ text }],
			};
			if (platform === 'x' && reply_to_url) {
				platformConfig['settings'] = { reply_to_url };
			}
			platformsBody[platform] = platformConfig;
		}

		const body: Record<string, unknown> = { platforms: platformsBody };
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
