import {createPiece} from '@activepieces/framework';
import {gmailSendEmailAction} from './actions/send-email-action';

export const gmail = createPiece({
	name: 'gmail',
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction],
  displayName:'Gmail',
	authors: ['AbdulTheActivePiecer'],
	triggers: [],
  version: '0.0.0',
});
