import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksVendor } from '../lib/types';

export const findVendorAction = createAction({
	auth: quickbooksAuth,
	name: 'find_vendor',
	displayName: 'Find Vendor',
	description: 'Search for a vendor by display name in QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'Look up a single QuickBooks vendor by exact display name, returning the first match. Use to resolve a vendor name to its full record (including its Id) before referencing it elsewhere; the match is exact, not fuzzy. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		search_term: Property.ShortText({
			displayName: 'Vendor Name',
			description: 'The display name of the vendor to search for.',
			required: true,
		}),
	},
	async run(context) {
		const { search_term } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const apiUrl = quickbooksCommon.getApiUrl(companyId as string);
		const query = `SELECT * FROM Vendor WHERE DisplayName = '${search_term.replace(
			/'/g,
			"\\'",
		)}' MAXRESULTS 1`;

		const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksVendor>>({
			method: HttpMethod.GET,
			url: `${apiUrl}/query`,
			queryParams: {
				query: query,
				minorversion: '70',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			headers: {
				Accept: 'application/json',
			},
		});

		if (
			response.body?.QueryResponse?.['Vendor'] &&
			response.body.QueryResponse['Vendor'].length > 0
		) {
			return {
				found: true,
				result: response.body.QueryResponse['Vendor'][0],
			};
		}

		return {
			found: false,
			result: {},
		};
	},
});
