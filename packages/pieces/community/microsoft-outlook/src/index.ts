import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { downloadAttachmentAction } from './lib/actions/download-email-attachment';
import { sendEmailAction } from './lib/actions/send-email';
import { microsoftOutlookAuth } from './lib/common/auth';
import { newEmailTrigger } from './lib/triggers/new-email';
import { replyEmail } from './lib/actions/reply-email';
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
		replyEmail,
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
