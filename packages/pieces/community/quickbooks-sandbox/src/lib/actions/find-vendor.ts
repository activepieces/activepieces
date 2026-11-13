import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { quickbooksApi } from '../common/api';
import type { QuickbooksAuthValue, QuickbooksEntityResponse, QuickbooksVendor } from '../common/types';
import { findVendorOutputSchema } from '../output-schemas';

export const findVendorAction = createAction({
	auth: quickbooksAuth,
	name: 'find_vendor',
	outputSchema: findVendorOutputSchema,
	displayName: 'Find Vendor',
	description: 'Search for a vendor in QuickBooks by display name, email address, or account number.',
	audience: 'human',
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
		if (!context.auth.props?.['companyId']) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const auth = context.auth;

		const vendor =
			searchBy === 'Email'
				? await findVendorByEmail({ auth, email: search_term })
				: await findVendorByField({
						auth,
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
	auth,
	field,
	value,
}: {
	auth: QuickbooksAuthValue;
	field: 'DisplayName' | 'AcctNum';
	value: string;
}): Promise<QuickbooksVendor | undefined> {
	const query = `SELECT * FROM Vendor WHERE ${field} = '${value.replace(/'/g, "\\'")}' MAXRESULTS 1`;

	const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksVendor>>({
		auth,
		query,
	});

	return response.QueryResponse?.['Vendor']?.[0];
}

async function findVendorByEmail({
	auth,
	email,
}: {
	auth: QuickbooksAuthValue;
	email: string;
}): Promise<QuickbooksVendor | undefined> {
	try {
		const escapedEmail = email.replace(/'/g, "\\'");
		const response = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksVendor>>({
			auth,
			query: `SELECT * FROM Vendor WHERE PrimaryEmailAddr = '${escapedEmail}' MAXRESULTS 1`,
		});

		if (!response.Fault) {
			const vendor = response.QueryResponse?.['Vendor']?.[0];
			if (vendor) {
				return vendor;
			}
		}
	} catch {
		return await findVendorByEmailScan({ auth, email });
	}

	return await findVendorByEmailScan({ auth, email });
}

async function findVendorByEmailScan({
	auth,
	email,
}: {
	auth: QuickbooksAuthValue;
	email: string;
}): Promise<QuickbooksVendor | undefined> {
	const listResponse = await quickbooksApi.query<QuickbooksEntityResponse<QuickbooksVendor>>({
		auth,
		query: `SELECT * FROM Vendor WHERE Active = true MAXRESULTS 1000`,
	});

	const vendors = listResponse.QueryResponse?.['Vendor'] ?? [];
	return vendors.find((vendor) => vendor.PrimaryEmailAddr?.Address?.toLowerCase() === email.toLowerCase());
}
