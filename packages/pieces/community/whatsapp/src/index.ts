import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { sendMedia } from './lib/actions/send-media';
import { sendTemplateMessageAction } from './lib/actions/send-from-template';
import { whatsappAuth } from './lib/auth';

export const whatsapp = createPiece({
	displayName: 'WhatsApp Business',
	description: 'Send text, media and template messages from your WhatsApp Business number.',
	auth: whatsappAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/whatsapp.png',
	categories: [PieceCategory.COMMUNICATION],
	authors: ['LevwTech', 'kishanprmr'],
	actions: [sendMessage, sendMedia, sendTemplateMessageAction],
	triggers: [],
});
