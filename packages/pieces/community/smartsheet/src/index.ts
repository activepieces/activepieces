import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

// Actions
import { addRowToSheet } from './lib/actions/add-row-to-sheet';
import { updateRow } from './lib/actions/update-row';
import { attachFileToRow } from './lib/actions/attach-file-to-row';
import { findRowsByQuery } from './lib/actions/find-rows-by-query';
import { findAttachmentByRowId } from './lib/actions/find-attachment-by-row-id';
import { findSheetByName } from './lib/actions/find-sheet-by-name';

// Webhook Triggers
import { newRowAddedTrigger } from './lib/triggers/new-row-trigger';
import { updatedRowTrigger } from './lib/triggers/updated-row-trigger';
import { newAttachmentTrigger } from './lib/triggers/new-attachment-trigger';
import { newCommentTrigger } from './lib/triggers/new-comment-trigger';

const markdownDescription = `
To obtain your Smartsheet access token:

1. Sign in to your Smartsheet account.
2. Click on your profile picture in the top right corner.
3. Select **Personal Settings** from the dropdown menu.
4. In the left panel, click **API Access**.
5. Click **Generate new access token**.
6. Enter a name for your token (e.g., "Activepieces Integration").
7. Click **OK** to generate the token..
8. Copy the access token and paste it into the connection field.
`;

export const smartsheetAuth = PieceAuth.SecretText({
	displayName: 'Access Token',
	description: markdownDescription,
	required: true,
	validate: async ({ auth }) => {
		if (!auth) {
			return {
				valid: false,
				error: 'Access token is required',
			};
		}
		try {
			const request: HttpRequest = {
				method: HttpMethod.GET,
				url: 'https://api.smartsheet.com/2.0/sheets',
				headers: {
					Authorization: `Bearer ${auth}`,
					'Content-Type': 'application/json',
				},
			};
			await httpClient.sendRequest(request);
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				error:
					'Invalid access token, insufficient permissions, or region mismatch. Ensure token is for api.smartsheet.com.',
			};
		}
	},
});

export const smartsheet = createPiece({
	displayName: 'Smartsheet',
	description:
		'Dynamic work execution platform for teams to plan, capture, manage, automate, and report on work at scale.',
	auth: smartsheetAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/smartsheet.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: ['onyedikachi-david', 'kishanprmr'],
	actions: [
		addRowToSheet,
		updateRow,
		attachFileToRow,
		findRowsByQuery,
		findAttachmentByRowId,
		findSheetByName,
	],
	triggers: [newRowAddedTrigger, updatedRowTrigger, newAttachmentTrigger, newCommentTrigger],
});
