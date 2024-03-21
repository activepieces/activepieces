import { microsoftSharePointAuth } from '../../';
import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Site, Drive } from '@microsoft/microsoft-graph-types';

export const microsoftSharePointCommon = {
	siteId: Property.Dropdown({
		displayName: 'Site ID',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof microsoftSharePointAuth>;

			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});

			const options: DropdownOption<string>[] = [];

			// https://sharepoint.stackexchange.com/questions/238094/how-could-i-get-all-root-level-sites-excluding-sub-site-using-microsoft-graph
			let response: PageCollection = await client
				.api('/sites?search=*&$select=displayName,id,name')
				// .search('*')
				// .select('id,name,displayName,webUrl')
				.get();

			while (response.value.length > 0) {
				for (const site of response.value as Site[]) {
					options.push({ label: site.displayName!, value: site.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
	driveId: Property.Dropdown({
		displayName: 'Drive ID',
		required: true,
		refreshers: ['siteId'],
		options: async ({ auth, siteId }) => {
			if (!auth || !siteId) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select site.',
					options: [],
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof microsoftSharePointAuth>;

			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});

			const options: DropdownOption<string>[] = [];

			let response: PageCollection = await client
				.api(`/sites/${siteId}/drives`)
				.select('id,name')
				.get();

			while (response.value.length > 0) {
				for (const drive of response.value as Drive[]) {
					options.push({ label: drive.name!, value: drive.id! });
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}

			return {
				disabled: false,
				options,
			};
		},
	}),
};
