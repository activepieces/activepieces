import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { twilioSendSms } from './lib/action/send-sms';
import { twilioNewIncomingSms } from './lib/trigger/new-incoming-sms';

export const twilio = createPiece({
    name: 'twilio',
    displayName: 'Twilio',
    logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
    version: packageJson.version,
    actions: [twilioSendSms],
    authors: ['abuaboud'],
    triggers: [twilioNewIncomingSms],
});
