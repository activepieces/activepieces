import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceArchivePagesOutputSchema } from '../../output-schemas';

export const archivePagesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_archive_pages',
	outputSchema: confluenceArchivePagesOutputSchema,
	displayName: 'Archive Pages',
	description: 'Archives one or more pages.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Starts archiving one or more Confluence pages (recoverable from the space archive) and returns a long task ID; poll it with Get Long Task Status. Needs the Archive permission and a paid plan. Idempotent in effect, but archiving an already archived page fails.',
		idempotent: true,
	},
	props: {
		pageIds: Property.Array({
			displayName: 'Page IDs',
			description: 'Numeric IDs of the pages to archive, from List Pages.',
			required: true,
		}),
	},
	async run(context) {
		const { pageIds } = context.propsValue;
		if (
			pageIds.length === 0 ||
			!pageIds.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error('Page IDs must be a non-empty list of page ID strings.');
		}
		return await confluenceApi.archivePages({ auth: context.auth, pageIds });
	},
});
