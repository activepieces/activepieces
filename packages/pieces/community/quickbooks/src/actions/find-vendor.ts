import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksVendor } from '../lib/types';

export const findVendorAction = createAction({
	auth: quickbooksAuth,
	name: 'find_vendor',
	displayName: 'Find Vendor',
	description: 'Search for a vendor in QuickBooks by display name, email address, or account number.',
	audience: 'both',
	aiMetadata: {
		description: 'Look up a single QuickBooks vendor by exact display name, email address, or account number (external ID), returning the first match. Use to resolve a vendor to its full record (including its Id) before referencing it elsewhere; the match is exact, not fuzzy. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		searchBy: Property.StaticDropdown({
			displayName: 'Search By',
			required: false,
			defaultValue: 'DisplayName',
			options: {
				options: [
					{ label: 'Vendor Name', value: 'DisplayName' },
					{ label: 'Email Address', value: 'Email' },
					{ label: 'Account Number', value: 'AcctNum' },
				],
			},
		}),
		search_term: Property.ShortText({
			displayName: 'Search Value',
			description: 'The exact vendor display name, email address, or account number to search for, depending on Search By.',
			required: true,
		}),
	},
	async run(context) {
		const { searchBy, search_term } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const apiUrl = quickbooksCommon.getApiUrl(companyId as string);
		const accessToken = context.auth.access_token;

		const vendor =
			searchBy === 'Email'
				? await findVendorByEmail({ accessToken, apiUrl, email: search_term })
				: await findVendorByField({
						accessToken,
						apiUrl,
						field: searchBy === 'AcctNum' ? 'AcctNum' : 'DisplayName',
						value: search_term,
				  });

		if (vendor) {
			return { found: true, result: vendor };
		}

		return { found: false, result: {} };
	},
});

async function findVendorByField({
	accessToken,
	apiUrl,
	field,
	value,
}: {
	accessToken: string;
	apiUrl: string;
	field: 'DisplayName' | 'AcctNum';
	value: string;
}): Promise<QuickbooksVendor | undefined> {
	const query = `SELECT * FROM Vendor WHERE ${field} = '${value.replace(/'/g, "\\'")}' MAXRESULTS 1`;

	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
	const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksVendor>>({
		method: HttpMethod.GET,
		url: `${apiUrl}/query`,
		queryParams: {
			query: query,
			minorversion: quickbooksCommon.minorVersion,
		},
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		headers: {
			Accept: 'application/json',
		},
	});

	return response.body.QueryResponse?.['Vendor']?.[0];
}

async function findVendorByEmail({
	accessToken,
	apiUrl,
	email,
}: {
	accessToken: string;
	apiUrl: string;
	email: string;
}): Promise<QuickbooksVendor | undefined> {
	try {
		const escapedEmail = email.replace(/'/g, "\\'");
		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
		const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksVendor>>({
			method: HttpMethod.GET,
			url: `${apiUrl}/query`,
			queryParams: {
				query: `SELECT * FROM Vendor WHERE PrimaryEmailAddr = '${escapedEmail}' MAXRESULTS 1`,
				minorversion: quickbooksCommon.minorVersion,
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			headers: {
				Accept: 'application/json',
			},
		});

		if (!response.body.Fault) {
			const vendor = response.body.QueryResponse?.['Vendor']?.[0];
			if (vendor) {
				return vendor;
			}
		}
	} catch {
		// QuickBooks does not document filtering Vendor by the nested PrimaryEmailAddr field consistently
		// across companies/sandboxes, so a rejected query falls back to a client-side scan below.
	}

	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
	const listResponse = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksVendor>>({
		method: HttpMethod.GET,
		url: `${apiUrl}/query`,
		queryParams: {
			query: `SELECT * FROM Vendor WHERE Active = true MAXRESULTS 1000`,
			minorversion: quickbooksCommon.minorVersion,
		},
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		headers: {
			Accept: 'application/json',
		},
	});

	const vendors = listResponse.body.QueryResponse?.['Vendor'] ?? [];
	return vendors.find((vendor) => vendor.PrimaryEmailAddr?.Address?.toLowerCase() === email.toLowerCase());
}
