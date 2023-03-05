import { createPiece } from '@activepieces/framework';
import { gmailGetEmail } from './actions/get-mail-action';
import { gmailSearchMail } from './actions/search-email-action';
import { gmailSendEmailAction } from './actions/send-email-action';
import { gmailNewEmailTrigger } from './triggers/new-email';

export const gmail = createPiece({
	name: 'gmail',
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction, gmailGetEmail, gmailSearchMail],
	displayName: 'Gmail',
	authors: ['AbdulTheActivePiecer', 'kanarelo'],
	triggers: [gmailNewEmailTrigger],
	version: '0.0.0',
});
