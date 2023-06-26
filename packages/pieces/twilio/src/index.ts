import { createPiece } from '@activepieces/pieces-framework';
import { twilioSendSms } from './lib/action/send-sms';
import { twilioNewIncomingSms } from './lib/trigger/new-incoming-sms';

export const twilio = createPiece({
    displayName: 'Twilio',
    logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
    actions: [twilioSendSms],
    authors: ['abuaboud'],
    triggers: [twilioNewIncomingSms],
});
