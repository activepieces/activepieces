import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksApi } from '../../../common/api';
import type { QuickbooksAuthValue } from '../../../common/types';
import { quickbooksSandboxGetCompanyInfoOutputSchema } from '../../../output-schemas';

export const getCompanyInfoAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_company_info',
	outputSchema: quickbooksSandboxGetCompanyInfoOutputSchema,
	displayName: 'Get Company Info',
	description: 'Gets the connected company\'s info.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the connected company\'s profile: names, addresses, email, phone, country, fiscal year start and SyncToken. Takes no input; the company is the one on the connection.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'CompanyInfo',
			id: connectedCompanyId({ auth: context.auth }),
		});
	},
});

function connectedCompanyId({ auth }: { auth: QuickbooksAuthValue }): string {
	const companyId = auth.props?.['companyId'];
	if (typeof companyId !== 'string' || companyId === '') {
		throw new Error('The QuickBooks connection has no Company ID.');
	}
	return companyId;
}
