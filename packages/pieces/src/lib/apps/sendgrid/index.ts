import {createPiece} from '../../framework/piece';
import { sendEmail } from './actions/send-email';

export const sendgrid = createPiece({
	name: 'sendgrid',
	displayName: "SendGrid",
	logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
	actions: [sendEmail],
	triggers: [],
});
