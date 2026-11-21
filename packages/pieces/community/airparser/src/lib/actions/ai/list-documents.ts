import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import {
	airparserClient,
	airparserOutputSchemas,
	DOCS_PAGE_SIZE_MAX,
	isRecord,
	pathFor,
	requireId,
	stringOrNull,
} from '../../common';

const STATUS_OPTIONS = ['importing', 'new', 'converting', 'parsing', 'parsed', 'fail', 'fail_pp', 'skipped', 'skipped_pp', 'quota', 'exception'];

export const listDocumentsAiAction = createAction({
	auth: airparserAuth,
	name: 'list_documents',
	classification: 'SEARCH',
	displayName: 'List Documents',
	description: 'List documents in an inbox, newest first, with optional filters.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists documents in one Airparser inbox, one page at a time (up to 100 per page), with optional date range (YYYY-MM-DD), text search and status filter. Returns document IDs and statuses plus hasNextPage; call again with page+1 while hasNextPage is true. Use Get Document for the parsed data. Read-only.',
		idempotent: true,
	},
	outputSchema: airparserOutputSchemas.listDocuments,
	props: {
		inboxId: Property.ShortText({ displayName: 'Inbox ID', description: 'The inbox ID, from List Inboxes.', required: true }),
		page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
		perPage: Property.Number({ displayName: 'Per Page', description: 'Documents per page, 1 to 100. Defaults to 25.', required: false }),
		from: Property.ShortText({ displayName: 'From Date', description: 'Only documents created on or after this date, YYYY-MM-DD.', required: false }),
		to: Property.ShortText({ displayName: 'To Date', description: 'Only documents created on or before this date, YYYY-MM-DD.', required: false }),
		q: Property.ShortText({ displayName: 'Search', description: 'Text to search for.', required: false }),
		status: Property.StaticMultiSelectDropdown({
			displayName: 'Status',
			description: 'Only documents with these statuses.',
			required: false,
			options: {
				options: STATUS_OPTIONS.map((value) => ({ label: value, value })),
			},
		}),
	},
	async run(context) {
		const { propsValue } = context;
		const inboxId = requireId({ value: propsValue.inboxId, label: 'Inbox ID' });
		const page = positiveInt({ value: propsValue.page, fallback: 1, max: Number.MAX_SAFE_INTEGER, label: 'Page' });
		const perPage = positiveInt({ value: propsValue.perPage, fallback: 25, max: DOCS_PAGE_SIZE_MAX, label: 'Per Page' });
		const from = dateOrUndefined({ value: propsValue.from, label: 'From Date' });
		const to = dateOrUndefined({ value: propsValue.to, label: 'To Date' });
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/inboxes${pathFor([inboxId])}/docs`,
			operation: 'list documents',
			query: {
				page,
				per_page: perPage,
				from,
				to,
				q: propsValue.q?.trim() || undefined,
				status: propsValue.status ?? [],
			},
		});
		const body = isRecord(response) ? response : {};
		const docs = Array.isArray(body['docs']) ? body['docs'].filter(isRecord) : [];
		return {
			docs: docs.map((doc) => ({
				id: stringOrNull(doc['_id']),
				name: stringOrNull(doc['name']),
				status: stringOrNull(doc['status']),
				created_at: stringOrNull(doc['created_at']),
				processed_at: stringOrNull(doc['processed_at']),
			})),
			page,
			per_page: perPage,
			hasNextPage: body['hasNextPage'] === true,
		};
	},
});

function positiveInt({ value, fallback, max, label }: { value: unknown; fallback: number; max: number; label: string }): number {
	if (value === undefined || value === null || value === '') {
		return fallback;
	}
	const num = Number(value);
	if (!Number.isInteger(num) || num < 1 || num > max) {
		throw new Error(`${label} must be a whole number from 1 to ${max}.`);
	}
	return num;
}

function dateOrUndefined({ value, label }: { value: unknown; label: string }): string | undefined {
	if (typeof value !== 'string' || value.trim() === '') {
		return undefined;
	}
	const text = value.trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
		throw new Error(`${label} must be a date in YYYY-MM-DD format.`);
	}
	return text;
}

