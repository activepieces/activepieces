import { createPiece } from '../../framework/piece';
import { twilioSendSms } from './action/send-sms';


export const twilio = createPiece({
    name: 'twilio', 
    displayName: 'Twilio',  
    logoUrl: 'https://cdn.activepieces.com/pieces/twilio.png',
    actions: [twilioSendSms],       
    triggers: [],
}); 