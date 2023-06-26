import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { twilioSendSms } from './lib/action/send-sms';
import { twilioNewIncomingSms } from './lib/trigger/new-incoming-sms';

export const twilioAuth = PieceAuth.BasicAuth({
    description: 'The authentication to use to connect to Twilio',
    displayName: 'Authentication',
    required: true,
    username: {
        displayName: 'Account SID',
        description: 'The account SID to use to connect to Twilio',
    },
    password: {
        displayName: 'Auth token',
        description: 'The auth token to use to connect to Twilio',
    }
})

export const twilio = createPiece({
    displayName: 'Twilio',
    logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
    auth: twilioAuth,
    actions: [twilioSendSms],
    authors: ['abuaboud'],
    triggers: [twilioNewIncomingSms],
});
