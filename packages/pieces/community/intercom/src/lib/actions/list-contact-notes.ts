import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { clampPerPage, requireText, toPagedList } from '../common/lookups';
import { listContactNotesOutputSchema } from '../output-schemas';

export const listContactNotesAction = createAction({
	auth: intercomAuth,
	name: 'list_contact_notes',
	classification: 'SEARCH',
	displayName: 'List Contact Notes',
	description: 'Lists the internal notes on a contact.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the internal notes on one contact, newest first, one page at a time; pass next_page to continue. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
		page: Property.Number({ displayName: 'Page', description: 'Starts at 1.', required: false }),
		perPage: Property.Number({ displayName: 'Results Per Page', description: '1 to 150. Default 50.', required: false }),
	},
	outputSchema: listContactNotesOutputSchema,
	async run(context) {
		const contactId = requireText({ label: 'Contact ID', value: context.propsValue.contactId });
		const page = context.propsValue.page ?? 1;
		if (!Number.isInteger(page) || page < 1) {
			throw new Error('Page must be a whole number of 1 or more.');
		}
		const body = await intercomRequest<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['contacts', contactId, 'notes'],
			query: { page, per_page: clampPerPage(context.propsValue.perPage) },
			operation: 'list the contact notes',
		});
		return toPagedList({ body, itemsKey: 'data' });
	},
});
