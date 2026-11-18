import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { resolveAdminId } from '../../common/client';
import { requireText } from '../../common/lookups';
import { articleOutputSchema } from '../../output-schemas';

export const createHelpCenterArticleAction = createAction({
	auth: intercomAuth,
	name: 'create_help_center_article',
	classification: 'WRITE',
	displayName: 'Create Help Center Article',
	description: 'Creates a Help Center article, as a draft unless told to publish.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Help Center article with a title and optional description, HTML body, author admin ID and parent collection ID. It is saved as a draft unless State is published, which makes it public. Use Search Help Center Articles to check for an existing article first. Each call creates another article, so retries duplicate.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'The article content. HTML is allowed.',
			required: false,
		}),
		authorId: Property.ShortText({
			displayName: 'Author Admin ID',
			description: 'Leave empty to use the admin who owns this connection.',
			required: false,
		}),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			defaultValue: 'draft',
			options: {
				disabled: false,
				options: [
					{ label: 'Draft', value: 'draft' },
					{ label: 'Published', value: 'published' },
				],
			},
		}),
		collectionId: Property.ShortText({
			displayName: 'Parent Collection ID',
			description: 'The Help Center collection to put the article in. Leave empty for none.',
			required: false,
		}),
	},
	outputSchema: articleOutputSchema,
	async run(context) {
		const title = requireText({ label: 'Title', value: context.propsValue.title });
		const authorId = toInteger({
			label: 'Author Admin ID',
			value: await resolveAdminId({ auth: context.auth, adminId: context.propsValue.authorId }),
		});
		const collectionId = context.propsValue.collectionId?.trim();
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['articles'],
			body: {
				title,
				description: context.propsValue.description || undefined,
				body: context.propsValue.body || undefined,
				author_id: authorId,
				state: context.propsValue.state === 'published' ? 'published' : 'draft',
				parent_id: collectionId ? toInteger({ label: 'Parent Collection ID', value: collectionId }) : undefined,
				parent_type: collectionId ? 'collection' : undefined,
			},
			operation: 'create the article',
		});
	},
});

function toInteger({ label, value }: { label: string; value: string }): number {
	const parsed = Number(value.trim());
	if (!Number.isInteger(parsed)) {
		throw new Error(`${label} must be a numeric Intercom ID, got "${value}".`);
	}
	return parsed;
}
