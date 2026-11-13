import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { listCompanies } from '../common/lookups';
import { listCompaniesOutputSchema } from '../output-schemas';

export const listCompaniesAction = createAction({
	auth: intercomAuth,
	name: 'list_companies',
	classification: 'SEARCH',
	displayName: 'List Companies',
	description: 'Lists companies, optionally only those with a tag or in a segment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists companies one page at a time, optionally only those with a tag or in a segment; pass next_page to continue. Intercom only lists companies that have at least one contact. Read-only.',
		idempotent: true,
	},
	props: {
		tagId: Property.ShortText({ displayName: 'Tag ID', required: false }),
		segmentId: Property.ShortText({ displayName: 'Segment ID', required: false }),
		page: Property.Number({ displayName: 'Page', description: 'Starts at 1.', required: false }),
		perPage: Property.Number({ displayName: 'Results Per Page', description: '1 to 150. Default 50.', required: false }),
	},
	outputSchema: listCompaniesOutputSchema,
	async run(context) {
		const tagId = context.propsValue.tagId?.trim() || undefined;
		const segmentId = context.propsValue.segmentId?.trim() || undefined;
		if (tagId && segmentId) {
			throw new Error('Filter by Tag ID or Segment ID, not both.');
		}
		const page = context.propsValue.page ?? 1;
		if (!Number.isInteger(page) || page < 1) {
			throw new Error('Page must be a whole number of 1 or more.');
		}
		return listCompanies({ auth: context.auth, tagId, segmentId, page, perPage: context.propsValue.perPage });
	},
});
