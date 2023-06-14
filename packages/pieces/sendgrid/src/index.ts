import { createPiece } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { sendDynamicTemplate } from './lib/actions/send-dynamic-template';

export const sendgrid = createPiece({
	displayName: "SendGrid",
	logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
	authors: ['ashrafsamhouri', "abuaboud"],
	actions: [sendEmail, sendDynamicTemplate],
	triggers: [],
});
