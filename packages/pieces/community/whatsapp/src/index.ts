import { createPiece } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { sendMedia } from './lib/actions/send-media';
import { sendTemplateMessageAction } from './lib/actions/send-from-template';
import { sendInteractiveButtons } from './lib/actions/send-interactive-buttons';
import { sendInteractiveList } from './lib/actions/send-interactive-list';
import { sendInteractiveCtaUrl } from './lib/actions/send-interactive-cta-url';
import { sendLocation } from './lib/actions/send-location';
import { sendContact } from './lib/actions/send-contact';
import { sendReaction } from './lib/actions/send-reaction';
import { markMessageAsRead } from './lib/actions/mark-message-as-read';
import { uploadMedia } from './lib/actions/upload-media';
import { getMediaUrl } from './lib/actions/get-media-url';
import { downloadMedia } from './lib/actions/download-media';
import { deleteMedia } from './lib/actions/delete-media';
import { listMessageTemplates } from './lib/actions/list-message-templates';
import { createMessageTemplate } from './lib/actions/create-message-template';
import { editMessageTemplate } from './lib/actions/edit-message-template';
import { deleteMessageTemplate } from './lib/actions/delete-message-template';
import { listPhoneNumbers } from './lib/actions/list-phone-numbers';
import { getPhoneNumber } from './lib/actions/get-phone-number';
import { getBusinessProfile } from './lib/actions/get-business-profile';
import { updateBusinessProfile } from './lib/actions/update-business-profile';
import { newIncomingMessage } from './lib/triggers/new-incoming-message';
import { newMessageReaction } from './lib/triggers/new-message-reaction';
import { messageStatusUpdated } from './lib/triggers/message-status-updated';
import { templateStatusUpdated } from './lib/triggers/template-status-updated';
import { whatsappAuth } from './lib/auth';

export const whatsapp = createPiece({
	displayName: 'WhatsApp Business',
	description: 'Manage your WhatsApp business account',
	auth: whatsappAuth,
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/whatsapp.png',
	authors: ['LevwTech', 'kishanprmr'],
	actions: [
		sendMessage,
		sendMedia,
		sendTemplateMessageAction,
		sendInteractiveButtons,
		sendInteractiveList,
		sendInteractiveCtaUrl,
		sendLocation,
		sendContact,
		sendReaction,
		markMessageAsRead,
		uploadMedia,
		getMediaUrl,
		downloadMedia,
		deleteMedia,
		listMessageTemplates,
		createMessageTemplate,
		editMessageTemplate,
		deleteMessageTemplate,
		listPhoneNumbers,
		getPhoneNumber,
		getBusinessProfile,
		updateBusinessProfile,
	],
	triggers: [newIncomingMessage, newMessageReaction, messageStatusUpdated, templateStatusUpdated],
});
