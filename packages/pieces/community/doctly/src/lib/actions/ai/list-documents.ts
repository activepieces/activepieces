import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyListDocumentsOutputSchema } from '../../output-schemas';

export const listDocumentsAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_list_documents',
	outputSchema: doctlyListDocumentsOutputSchema,
	displayName: 'List Documents',
	description: 'Lists processed documents, newest first, with optional filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the account\'s documents with their id, status and extractor, filtered by file name, extractor, uploader or date. Returns one page and the total count; pass skip to read the next page. Use Get Document to read one document\'s output.',
		idempotent: true,
	},
	props: {
		search: Property.ShortText({ displayName: 'Search', description: 'Text to match in the file name.', required: false }),
		extractorId: doctlyAiProps.extractorId({ required: false, description: 'Only documents run through this extractor (UUID). Use List Extractors to find it.' }),
		noExtractor: doctlyAiProps.booleanFlag({ required: false, displayName: 'No Extractor', description: 'Set to true for plain markdown conversions only. Defaults to false.' }),
		userId: Property.ShortText({ displayName: 'User ID', description: 'Only documents uploaded by this user (UUID).', required: false }),
		userEmail: Property.ShortText({ displayName: 'User Email', description: 'Only documents uploaded by the user with this email.', required: false }),
		dateFrom: Property.ShortText({ displayName: 'Date From', description: 'Only documents created on or after this date, e.g. 2026-01-31.', required: false }),
		dateTo: Property.ShortText({ displayName: 'Date To', description: 'Only documents created on or before this date, e.g. 2026-01-31.', required: false }),
		limit: Property.Number({ displayName: 'Limit', description: 'Max documents to return (1-100). Defaults to 50.', required: false }),
		skip: Property.Number({ displayName: 'Skip', description: 'How many documents to skip, for paging. Defaults to 0.', required: false }),
	},
	async run(context) {
		const { search, extractorId, noExtractor, userId, userEmail, dateFrom, dateTo, limit, skip } = context.propsValue;
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/documents/',
			query: {
				search,
				extractor_id: extractorId,
				no_extractor: noExtractor,
				user_id: userId,
				user_email: userEmail,
				date_from: dateFrom,
				date_to: dateTo,
				limit: String(Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)),
				skip: skip === undefined ? undefined : String(skip),
			},
		});
	},
});

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
