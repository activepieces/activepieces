import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { sendEmail } from './lib/actions/send-email';
import { sendDynamicTemplate } from './lib/actions/send-dynamic-template';

export const sendgrid = createPiece({
	name: 'sendgrid',
	displayName: "SendGrid",
	logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
	version: packageJson.version,
	authors: ['ashrafsamhouri', "abuaboud"],
	actions: [sendEmail, sendDynamicTemplate],
	triggers: [],
});
