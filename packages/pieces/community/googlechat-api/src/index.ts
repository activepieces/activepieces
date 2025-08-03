
    import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
    import { PieceCategory } from '@activepieces/shared';

    // Import actions
    import { sendMessage } from './lib/actions/send-message';
    import { getDirectMessageDetails } from './lib/actions/get-direct-message-details';
    import { addSpaceMember } from './lib/actions/add-space-member';
    import { getMessage } from './lib/actions/get-message';
    import { searchMessages } from './lib/actions/search-messages';
    import { findMember } from './lib/actions/find-member';

    // Import triggers
    import { newMessage } from './lib/triggers/new-message';
    import { newMention } from './lib/triggers/new-mention';

    export const googleChatApiAuth = PieceAuth.OAuth2({
    	authUrl: 'https://accounts.google.com/o/oauth2/auth',
    	tokenUrl: 'https://oauth2.googleapis.com/token',
    	required: true,
    	scope: [
    		'https://www.googleapis.com/auth/chat.messages',
    		'https://www.googleapis.com/auth/chat.spaces',
    		'https://www.googleapis.com/auth/chat.messages.create',
    		'https://www.googleapis.com/auth/chat.bot',
    		'https://www.googleapis.com/auth/chat.messages.readonly',
    		'https://www.googleapis.com/auth/chat.spaces.readonly',
    	],
    });

    export const googlechatApi = createPiece({
    	displayName: "Google Chat API",
    	description: "Send messages and interact with Google Chat spaces",
    	minimumSupportedRelease: '0.36.1',
    	logoUrl: "https://cdn.activepieces.com/pieces/googlechat-api.png",
    	categories: [PieceCategory.COMMUNICATION],
    	authors: [],
    	auth: googleChatApiAuth,
    	actions: [
    		sendMessage,
    		getDirectMessageDetails,
    		addSpaceMember,
    		getMessage,
    		searchMessages,
    		findMember,
    	],
    	triggers: [
    		newMessage,
    		newMention,
    	],
    });
    