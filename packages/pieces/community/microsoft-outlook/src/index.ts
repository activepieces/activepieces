import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { downloadAttachmentAction } from './lib/actions/download-email-attachment';
import { sendEmailAction } from './lib/actions/send-email';
import { createDraftEmailAction } from './lib/actions/create-draft-email';
import { addLabelToEmailAction } from './lib/actions/add-label-to-email';
import { removeLabelFromEmailAction } from './lib/actions/remove-label-from-email';
import { moveEmailToFolderAction } from './lib/actions/move-email-to-folder';
import { sendDraftEmailAction } from './lib/actions/send-draft-email';
import { forwardEmailAction } from './lib/actions/forward-email';

import { microsoftOutlookAuth } from './lib/common/auth';

import { newEmailTrigger } from './lib/triggers/new-email';
import { replyEmailAction } from './lib/actions/reply-email';
export const microsoftOutlook = createPiece({
	displayName: 'Microsoft Outlook',
	auth: microsoftOutlookAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/outlook.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: ['lucaslimasouza', 'kishanprmr'],
	actions: [
		sendEmailAction,
		downloadAttachmentAction,
		replyEmailAction,
		createDraftEmailAction,
		addLabelToEmailAction,
		removeLabelFromEmailAction,
		moveEmailToFolderAction,
		sendDraftEmailAction,
		forwardEmailAction,
		createCustomApiCallAction({
			auth: microsoftOutlookAuth,
			baseUrl: () => 'https://graph.microsoft.com/v1.0/',
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [newEmailTrigger],
});
