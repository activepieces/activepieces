import {
	DropdownOption,
	PiecePropValueSchema,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { smartSuiteApiCall, TableStucture } from '../common';

export const findRecords = createAction({
	name: 'find_records',
	displayName: 'Find Records',
	description: 'Searches for records in the specified table based on criteria.',
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		searchField: Property.Dropdown({
			displayName: 'Search Field',
			required: true,
			refreshers: ['tableId'],
			options: async ({ auth, tableId }) => {
				if (!auth || !tableId) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account first.',
					};
				}

				const { apiKey, accountId } = auth as PiecePropValueSchema<typeof smartsuiteAuth>;

				const response = await smartSuiteApiCall<{
					structure: TableStucture[];
				}>({
					apiKey,
					accountId,
					method: HttpMethod.GET,
					resourceUri: `/applications/${tableId}`,
				});

				const options: DropdownOption<string>[] = [];

				for (const field of response.structure) {
					if (field.params.is_auto_generated || field.params.system) {
						continue;
					}

					options.push({ label: field.label, value: field.slug });
				}
				return {
					disabled: false,
					options,
				};
			},
		}),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { solutionId, tableId, searchField, searchValue } = propsValue;

		try {
			const tableResponse = await smartSuiteApiCall<{
				structure: TableStucture[];
			}>({
				apiKey: auth.apiKey,
				accountId: auth.accountId,
				method: HttpMethod.GET,
				resourceUri: `/applications/${tableId}`,
			});
			const tableSchema = tableResponse.structure;

			const matchedRecords = [];

			const qs = { limit: 100, offset: 0 };
			let hasMore = true;

			do {
				const response = await smartSuiteApiCall<{ items: Record<string, any>[] }>({
					accountId: auth.accountId,
					apiKey: auth.apiKey,
					method: HttpMethod.POST,
					resourceUri: `/applications/${tableId}/records/list/`,
					query: qs,
					body: {
						filter: {
							operator: 'and',
							fields: [
								{
									field: searchField,
									comparison: 'is',
									value: searchValue,
								},
							],
						},
					},
				});
				const items = response.items || [];
				matchedRecords.push(...items);

				hasMore = items.length > 0;
				if (hasMore) {
					qs.offset = Number(qs.offset) + Number(qs.limit);
				}
			} while (hasMore);

			return {
				found: matchedRecords.length > 0,
				result: matchedRecords.map((record) => transformRecordFields(tableSchema, record)),
			};
		} catch (error: any) {
			if (error.response?.status === 400) {
				throw new Error(
					`Invalid filter or sort criteria: ${
						error.response?.body?.message || 'Please check your filter JSON format'
					}`,
				);
			}

			if (error.response?.status === 403) {
				throw new Error('You do not have permission to access this table');
			}

			if (error.response?.status === 404) {
				throw new Error(`Solution or table not found: ${solutionId}/${tableId}`);
			}

			throw new Error(`Failed to find records: ${error.message || 'Unknown error'}`);
		}
	},
});
