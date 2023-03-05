import {createPiece} from '@activepieces/framework';
import { gmailGetEmail } from './actions/get-mail-action';
import {gmailSendEmailAction} from './actions/send-email-action';
import { gmailNewEmailTrigger } from './triggers/new-email';

export const gmail = createPiece({
	name: 'gmail',
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction, gmailGetEmail],
  displayName:'Gmail',
	authors: ['AbdulTheActivePiecer'],
	triggers: [gmailNewEmailTrigger],
  version: '0.0.0',
});
