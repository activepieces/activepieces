import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listRowsActionOutputSchema } from '../output-schemas';

export const listRowsAction = createAction({
	auth: codaAuth,
	name: 'list_rows',
	classification: 'SEARCH',
	displayName: 'List Rows',
	description: 'Lists rows of a table one page at a time, optionally only rows where a column equals a value.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists rows of a Coda table one page at a time, optionally only those whose column equals a value, with values keyed by column name. Use to find row IDs before Get Row, Update Row or Delete Rows; pass Next Page Token to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		filterColumn: Property.ShortText({
			displayName: 'Filter Column',
			description: 'Optional column ID or name. Only rows where this column equals Filter Value are returned.',
			required: false,
		}),
		filterValue: Property.ShortText({
			displayName: 'Filter Value',
			description: 'The value the Filter Column must equal. Required when Filter Column is set.',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			required: false,
			defaultValue: 'natural',
			options: {
				disabled: false,
				options: [
					{ label: 'Table order', value: 'natural' },
					{ label: 'Created time (oldest first)', value: 'createdAt' },
					{ label: 'Updated time (oldest first)', value: 'updatedAt' },
				],
			},
		}),
		useColumnNames: Property.Checkbox({
			displayName: 'Key Values by Column Name',
			description: 'When off, values are keyed by column ID, which does not change if a column is renamed.',
			required: false,
			defaultValue: true,
		}),
		valueFormat: Property.StaticDropdown({
			displayName: 'Value Format',
			required: false,
			defaultValue: 'simpleWithArrays',
			options: {
				disabled: false,
				options: [
					{ label: 'Simple (lists as arrays)', value: 'simpleWithArrays' },
					{ label: 'Simple (lists as text)', value: 'simple' },
					{ label: 'Rich (links, people, currency as objects)', value: 'rich' },
				],
			},
		}),
		visibleOnly: Property.Checkbox({
			displayName: 'Visible Columns Only',
			required: false,
			defaultValue: false,
		}),
		limit: codaProps.limit({ max: 500, defaultValue: 100 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listRowsActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, filterColumn, filterValue, sortBy, useColumnNames, valueFormat, visibleOnly, limit, pageToken } =
			context.propsValue;
		const column = filterColumn?.trim();
		if (column && (filterValue === undefined || filterValue === null)) {
			throw new Error('Filter Value is required when Filter Column is set.');
		}
		if (!column && filterValue !== undefined && filterValue !== null && filterValue !== '') {
			throw new Error('Filter Column is required when Filter Value is set.');
		}
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows`,
			operation: 'list rows',
			query: {
				query: column ? codaApi.buildRowQuery({ column, value: filterValue }) : undefined,
				sortBy: sortBy ?? 'natural',
				useColumnNames: useColumnNames !== false,
				valueFormat: valueFormat ?? 'simpleWithArrays',
				visibleOnly: visibleOnly === true ? true : undefined,
				limit: codaApi.validateLimit({ limit, max: 500 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
