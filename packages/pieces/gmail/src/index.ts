import { createPiece } from '@activepieces/pieces-framework';
import { gmailSendEmailAction } from './lib/actions/send-email-action';

export const gmail = createPiece({
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction],
	displayName: 'Gmail',
	authors: ['AbdulTheActivePiecer', 'kanarelo'],
	triggers: [],
});
