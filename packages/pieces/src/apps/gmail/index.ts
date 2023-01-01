import {createPiece} from '../../framework/piece';
import {gmailSendEmailAction} from './actions/send-email-action';

export const gmail = createPiece({
	name: 'gmail',
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction],
    displayName:'Gmail',
	triggers: [],
});