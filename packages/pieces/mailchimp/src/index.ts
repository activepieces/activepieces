import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import {addMemberToList} from './lib/actions/add-member-to-list.action/add-member-to-list.action'
import {mailChimpSubscribeTrigger} from './lib/triggers/subscribe-trigger';

export const mailchimp = createPiece({
	name: 'mailchimp',
	displayName: "Mailchimp",
	logoUrl: 'https://cdn.activepieces.com/pieces/mailchimp.png',
  version: packageJson.version,
	authors: ['AbdulTheActivePiecer'],
	actions: [addMemberToList],
	triggers: [mailChimpSubscribeTrigger],
});
