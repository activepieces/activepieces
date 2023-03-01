import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import {gmailSendEmailAction} from './lib/actions/send-email-action';

export const gmail = createPiece({
	name: 'gmail',
	logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
	actions: [gmailSendEmailAction],
  displayName:'Gmail',
	authors: ['AbdulTheActivePiecer'],
	triggers: [],
  version: packageJson.version,
});
