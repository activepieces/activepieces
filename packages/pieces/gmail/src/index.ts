import { createPiece } from '@activepieces/pieces-framework';
import { gmailSendEmailAction } from './lib/actions/send-email-action';
import packageJson from '../package.json';

export const gmail = createPiece({
	name: 'gmail',
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction],
	displayName: 'Gmail',
	authors: ['AbdulTheActivePiecer', 'kanarelo'],
	triggers: [],
	version: packageJson.version,
});
