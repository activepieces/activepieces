import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { updateRecordAction } from './lib/actions/update-record';
import { getRecordAction } from './lib/actions/get-record';
import { searchRecordsAction } from './lib/actions/search-records';

export const nocodbAuth = PieceAuth.CustomAuth({
	description: `
  1. Log in to your NocoDB Account.
  2. Click on your profile-pic(bottom-left) and navigate to **Account Settings->Tokens**.
  3. Create new token with any name and copy API Token.
  4. Your Base URL is where your app is hosted.`,
	props: {
		baseUrl: Property.ShortText({
			displayName: 'NocoDB Base URL',
			required: true,
			defaultValue: 'https://app.nocodb.com',
		}),
		apiToken: PieceAuth.SecretText({
			displayName: 'API Token',
			required: true,
		}),
		version: Property.StaticDropdown({
			displayName: 'API Version',
			description: 'Required only for self-hosted instances. Not needed for the cloud version.',
			required: false,
			defaultValue: 0,
			options: {
				options: [
					{ label: 'Before v0.90.0', value: 1 },
					{ label: 'v0.90.0 to v0.199.0', value: 2 },
					{ label: 'v0.200.0 Onwards', value: 3 }
				]
			}
		}),
	},
	required: true,
});

export const nocodb = createPiece({
	displayName: 'NocoDB',
	auth: nocodbAuth,
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/nocodb.png',
	authors: ['kishanprmr'],
	actions: [
		createRecordAction,
		deleteRecordAction,
		updateRecordAction,
		getRecordAction,
		searchRecordsAction,
	],
	triggers: [],
});
