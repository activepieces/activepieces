import {createComponent} from '../../framework/piece';
import {gmailSendEmailAction} from './actions/send-email-action';

export const gmail = createComponent({
	name: 'Gmail',
	logoUrl: 'https://cdn.activepieces.com/components/gmail/logo.png',
	actions: [gmailSendEmailAction],
    displayName:'Gmail',
	triggers: [],
});