import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksClient } from './common/client';
import type { QuickbooksCompanyInfo } from './common/types';

export const quickbooksAuth = PieceAuth.OAuth2({
	description: 'Connects a QuickBooks **Sandbox** company. You can find Company ID under **settings->Additional Info**.',
	required: true,
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			required: true,
		}),
	},
	authUrl: 'https://appcenter.intuit.com/connect/oauth2',
	tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
	scope: ['com.intuit.quickbooks.accounting'],
	getConnectionIdentifier: async ({ auth }) => {
		const rawCompanyId = auth.props?.['companyId'];
		const companyId = typeof rawCompanyId === 'string' ? rawCompanyId.trim() : '';
		if (!companyId) {
			return undefined;
		}
		try {
			const response = await quickbooksClient.request<{ CompanyInfo?: QuickbooksCompanyInfo }>({
				auth: { access_token: auth.access_token, props: { companyId } },
				method: HttpMethod.GET,
				path: `/companyinfo/${companyId}`,
				timeout: 5000,
			});
			const info = response.CompanyInfo;
			return info?.CompanyName || info?.LegalName || info?.Email?.Address || undefined;
		} catch {
			return undefined;
		}
	},
});
