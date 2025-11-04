import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { findRecordAction } from './lib/actions/find-record';
import { createEntryAction } from './lib/actions/create-entry';
import { updateEntryAction } from './lib/actions/update-entry';
import { findListEntryAction } from './lib/actions/find-list-entry';

// Import triggers
import { recordCreatedTrigger } from './lib/triggers/record-created';
import { recordUpdatedTrigger } from './lib/triggers/record-updated';
import { listEntryCreatedTrigger } from './lib/triggers/list-entry-created';
import { listEntryUpdatedTrigger } from './lib/triggers/list-entry-updated';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

const markdownDescription = `
To use Attio, you need to generate an Access Token:
1. Login to your Attio account at https://app.attio.com.
2. From the dropdown beside your workspace name, click Workspace settings.
3. Click the Developers tab.
4. Click on the "New Access Token" button.
5. Set the appropriate Scopes for the integration.
6. Copy the generated Access Token.
`;

export const attioAuth = PieceAuth.SecretText({
	displayName: 'Access Token',
	description: markdownDescription,
	required: true,
});

export const attio = createPiece({
	displayName: 'Attio',
	description: 'Modern, collaborative CRM platform built to be fully customizable and real-time.',
	auth: attioAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/attio.png',
	categories: [PieceCategory.SALES_AND_CRM],
	authors: ['AnkitSharmaOnGithub', 'kishanprmr'],
	actions: [
		createRecordAction,
		updateRecordAction,
		findRecordAction,
		createEntryAction,
		updateEntryAction,
		findListEntryAction,
		createCustomApiCallAction({
			auth: attioAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	triggers: [
		recordCreatedTrigger,
		recordUpdatedTrigger,
		listEntryCreatedTrigger,
		listEntryUpdatedTrigger,
	],
});
