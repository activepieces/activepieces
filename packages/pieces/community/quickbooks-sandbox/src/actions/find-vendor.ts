import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';
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

		const accessToken = context.auth.access_token;

		const vendor =
			searchBy === 'Email'
				? await findVendorByEmail({ accessToken, companyId: companyId as string, email: search_term })
				: await findVendorByField({
						accessToken,
						companyId: companyId as string,
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
	companyId,
	field,
	value,
}: {
	accessToken: string;
	companyId: string;
	field: 'DisplayName' | 'AcctNum';
	value: string;
}): Promise<QuickbooksVendor | undefined> {
	const query = `SELECT * FROM Vendor WHERE ${field} = '${value.replace(/'/g, "\\'")}' MAXRESULTS 1`;

	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
	const response = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksVendor>>({
		accessToken,
		companyId,
		query,
	});

	return response.QueryResponse?.['Vendor']?.[0];
}

async function findVendorByEmail({
	accessToken,
	companyId,
	email,
}: {
	accessToken: string;
	companyId: string;
	email: string;
}): Promise<QuickbooksVendor | undefined> {
	try {
		const escapedEmail = email.replace(/'/g, "\\'");
		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
		const response = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksVendor>>({
			accessToken,
			companyId,
			query: `SELECT * FROM Vendor WHERE PrimaryEmailAddr = '${escapedEmail}' MAXRESULTS 1`,
		});

		if (!response.Fault) {
			const vendor = response.QueryResponse?.['Vendor']?.[0];
			if (vendor) {
				return vendor;
			}
		}
	} catch {
		// QuickBooks does not document filtering Vendor by the nested PrimaryEmailAddr field consistently
		// across companies/sandboxes, so a rejected query falls back to a client-side scan below.
	}

	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
	const listResponse = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksVendor>>({
		accessToken,
		companyId,
		query: `SELECT * FROM Vendor WHERE Active = true MAXRESULTS 1000`,
	});

	const vendors = listResponse.QueryResponse?.['Vendor'] ?? [];
	return vendors.find((vendor) => vendor.PrimaryEmailAddr?.Address?.toLowerCase() === email.toLowerCase());
}
