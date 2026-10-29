import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../../auth';
import { codaApi } from '../../common/client';
import { codaProps } from '../../common/ai-props';
import { getTableActionOutputSchema } from '../../output-schemas';

export const getTableByIdAction = createAction({
	auth: codaAuth,
	name: 'get_table_by_id',
	classification: 'READ',
	displayName: 'Get Table (by ID)',
	description: 'Gets a table\'s details by doc ID and table ID or name.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns one Coda table\'s metadata (name, type, row count, display column, page, link) by doc ID and table ID or name. It does not return columns; use List Columns for those. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
	},
	outputSchema: getTableActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName } = context.propsValue;
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: codaApi.tablePath({ docId, tableIdOrName }),
			operation: 'get table',
		});
	},
});
