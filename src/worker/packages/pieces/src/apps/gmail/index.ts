import {createPiece} from '../../framework/piece';
import {gmailSendEmailAction} from './actions/send-email-action';

export const gmail = createPiece({
	name: 'Gmail',
	logoUrl: 'https://cdn.activepieces.com/components/gmail.png',
	actions: [gmailSendEmailAction],
    displayName:'Gmail',
	triggers: [],
});