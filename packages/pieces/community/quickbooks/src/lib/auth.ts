import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { quickbooksCommon } from './common';

export const quickbooksAuth = PieceAuth.OAuth2({
	description: 'You can find Company ID under **settings->Additional Info**.',
	required: true,
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			required: true,
		})	},
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
			const response = await httpClient.sendRequest<{ CompanyInfo?: QuickbooksCompanyInfo }>({
				method: HttpMethod.GET,
				url: `${quickbooksCommon.getApiUrl(companyId)}/companyinfo/${companyId}`,
				queryParams: { minorversion: quickbooksCommon.minorVersion },
				headers: {
					Authorization: `Bearer ${auth.access_token}`,
					Accept: 'application/json',
				},
				timeout: 5000,
			});
			const info = response.body.CompanyInfo;
			return info?.CompanyName || info?.LegalName || info?.Email?.Address || undefined;
		} catch {
			return undefined;
		}
	},
});

type QuickbooksCompanyInfo = {
	CompanyName?: string;
	LegalName?: string;
	Email?: { Address?: string };
};
