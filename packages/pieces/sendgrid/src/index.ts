import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { sendEmail } from './lib/actions/send-email';

export const sendgrid = createPiece({
	name: 'sendgrid',
	displayName: "SendGrid",
	logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
  version: packageJson.version,
	authors: ['ashrafsamhouri'],
	actions: [sendEmail],
	triggers: [],
});
