import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps, intercomClient } from '../common';
import { collectionIdProp } from '../common/props';

export const createArticleAction = createAction({
	auth: intercomAuth,
	name: 'create-article',
	displayName: 'Create Article',
	description: 'Creates a new article in your Help Center.',
	audience: 'both',
	aiMetadata: { description: 'Create a new Help Center article with title, optional description and body, an author admin, and a draft or published state, optionally nested under a parent collection. Always creates a new article, so it is not idempotent and repeated calls produce duplicates.', idempotent: false },
	props: {
		title: Property.LongText({
			displayName: 'Title',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			required: false,
		}),
		authorId: commonProps.admins({ displayName: 'Author', required: true }),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: true,
			defaultValue: 'draft',
			options: {
				disabled: false,
				options: [
					{ label: 'Draft', value: 'draft' },
					{ label: 'Published', value: 'published' },
				],
			},
		}),
		collectionId: collectionIdProp('Parent Collection', false),
	},
	async run(context) {
		const { authorId, collectionId, title, description, body, state } = context.propsValue;

		if (!authorId) {
			throw new Error('Author is required');
		}

		const client = intercomClient(context.auth);

		const response = await client.articles.create({
			title,
			description,
			body,
			author_id: Number(authorId),
			state: state as 'published' | 'draft',
			parent_id: collectionId ? Number(collectionId) : undefined,
		});

		return response;
	},
});
