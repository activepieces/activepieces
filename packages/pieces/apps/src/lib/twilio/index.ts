import { createPiece } from '@activepieces/framework';
import { twilioSendSms } from './action/send-sms';
import { twilioNewIncomingSms } from './trigger/new-incoming-sms';

export const twilio = createPiece({
    name: 'twilio',
    displayName: 'Twilio',
    logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
    version: '0.0.0',
    actions: [twilioSendSms],
    authors: ['abuaboud'],
    triggers: [twilioNewIncomingSms],
});
