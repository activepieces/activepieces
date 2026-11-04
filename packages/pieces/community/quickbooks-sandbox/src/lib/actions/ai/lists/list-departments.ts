import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListDepartmentsOutputSchema } from '../../../output-schemas';

export const listDepartmentsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_departments',
	outputSchema: quickbooksSandboxListDepartmentsOutputSchema,
	displayName: 'List Departments',
	description: 'Lists departments, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists departments (shown as locations in QuickBooks) one page at a time, with an optional QuickBooks query filter (e.g. "Name LIKE \'North%\'") and sort. Needs QuickBooks Online Plus or Advanced with location tracking on. Inactive departments are left out unless the filter asks for them (e.g. "Active = false"). Page with startPosition and the returned nextStartPosition (null on the last page).',
		idempotent: true,
	},
	props: {
		where: quickbooksAiProps.where({ required: false }),
		orderBy: quickbooksAiProps.orderBy({ required: false }),
		limit: quickbooksAiProps.limit({ required: false }),
		startPosition: quickbooksAiProps.startPosition({ required: false }),
	},
	async run(context) {
		const { where, orderBy, limit, startPosition } = context.propsValue;
		return await quickbooksApi.listEntities({
			auth: context.auth,
			entity: 'Department',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
