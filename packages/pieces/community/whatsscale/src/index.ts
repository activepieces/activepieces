import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { whatsscaleAuth } from './lib/auth';

//  Text actions
import { sendTextManualAction } from './lib/actions/messaging/send-text-manual';
import { sendTextToContactAction } from './lib/actions/messaging/send-text-to-contact';
import { sendTextToGroupAction } from './lib/actions/messaging/send-text-to-group';
import { sendTextToChannelAction } from './lib/actions/messaging/send-text-to-channel';
import { sendTextToCrmContactAction } from './lib/actions/messaging/send-text-to-crm-contact';

// Image actions
import { sendImageToContactAction } from './lib/actions/messaging/send-image-to-contact';
import { sendImageToGroupAction } from './lib/actions/messaging/send-image-to-group';
import { sendImageToChannelAction } from './lib/actions/messaging/send-image-to-channel';
import { sendImageToCrmContactAction } from './lib/actions/messaging/send-image-to-crm-contact';
import { sendImageManualAction } from './lib/actions/messaging/send-image-manual';

// Video actions
import { sendVideoToContactAction } from './lib/actions/messaging/send-video-to-contact';
import { sendVideoToGroupAction } from './lib/actions/messaging/send-video-to-group';
import { sendVideoToChannelAction } from './lib/actions/messaging/send-video-to-channel';
import { sendVideoToCrmContactAction } from './lib/actions/messaging/send-video-to-crm-contact';
import { sendVideoManualAction } from './lib/actions/messaging/send-video-manual';

// Document actions
import { sendDocumentToContactAction } from './lib/actions/messaging/send-document-to-contact';
import { sendDocumentToGroupAction } from './lib/actions/messaging/send-document-to-group';
import { sendDocumentToCrmContactAction } from './lib/actions/messaging/send-document-to-crm-contact';

// Location actions
import { sendLocationToContactAction } from './lib/actions/messaging/send-location-to-contact';
import { sendLocationToGroupAction } from './lib/actions/messaging/send-location-to-group';
import { sendLocationToCrmContactAction } from './lib/actions/messaging/send-location-to-crm-contact';

// Poll actions
import { sendPollToContactAction } from './lib/actions/messaging/send-poll-to-contact';
import { sendPollToGroupAction } from './lib/actions/messaging/send-poll-to-group';
import { sendPollToChannelAction } from './lib/actions/messaging/send-poll-to-channel';
import { sendPollToCrmContactAction } from './lib/actions/messaging/send-poll-to-crm-contact';

// Story actions
import { setTextStoryAction } from './lib/actions/stories/set-text-story';
import { setImageStoryAction } from './lib/actions/stories/set-image-story';
import { setVideoStoryAction } from './lib/actions/stories/set-video-story';

// Info actions
import { getGroupInfoAction } from './lib/actions/info/get-group-info';
import { getChannelInfoAction } from './lib/actions/info/get-channel-info';

// CRM actions
import { createCrmContactAction } from './lib/actions/crm/create-crm-contact';
import { getCrmContactAction } from './lib/actions/crm/get-crm-contact';
import { findCrmContactByPhoneAction } from './lib/actions/crm/find-crm-contact-by-phone';
import { updateCrmContactAction } from './lib/actions/crm/update-crm-contact';
import { deleteCrmContactAction } from './lib/actions/crm/delete-crm-contact';
import { addCrmContactTagAction } from './lib/actions/crm/add-crm-contact-tag';
import { removeCrmContactTagAction } from './lib/actions/crm/remove-crm-contact-tag';
import { listCrmContactsAction } from './lib/actions/crm/list-crm-contacts';

// Utility actions
import { checkWhatsappAction } from './lib/actions/utility/check-whatsapp';

//   Triggers
import { watchIncomingMessagesTrigger } from './lib/triggers/watch-incoming-messages';
import { watchGroupMessagesTrigger } from './lib/triggers/watch-group-messages';
import { watchChannelMessagesTrigger } from './lib/triggers/watch-channel-messages';
import { watchSpecificGroupMessagesTrigger } from './lib/triggers/watch-specific-group-messages';
import { watchSpecificChannelMessagesTrigger } from './lib/triggers/watch-specific-channel-messages';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const whatsscale = createPiece({
  displayName: 'WhatsScale',
  auth: whatsscaleAuth,
  minimumSupportedRelease: '0.36.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/whatsscale.png',
  authors: ['whatsscale'],
  description:
    'Send WhatsApp messages, manage contacts, and automate conversations via WAHA',
  categories: [
    PieceCategory.COMMUNICATION,
    PieceCategory.MARKETING,
    PieceCategory.SALES_AND_CRM,
  ],
  actions: [
    // Text actions
    sendTextManualAction,
    sendTextToContactAction,
    sendTextToGroupAction,
    sendTextToChannelAction,
    sendTextToCrmContactAction,
    // Image actions
    sendImageToContactAction,
    sendImageToGroupAction,
    sendImageToChannelAction,
    sendImageToCrmContactAction,
    sendImageManualAction,
    // Video actions
    sendVideoToContactAction,
    sendVideoToGroupAction,
    sendVideoToChannelAction,
    sendVideoToCrmContactAction,
    sendVideoManualAction,
    // Document actions
    sendDocumentToContactAction,
    sendDocumentToGroupAction,
    sendDocumentToCrmContactAction,
    // CRM actions
    createCrmContactAction,
    getCrmContactAction,
    findCrmContactByPhoneAction,
    updateCrmContactAction,
    deleteCrmContactAction,
    addCrmContactTagAction,
    removeCrmContactTagAction,
    listCrmContactsAction,
    // Location actions
    sendLocationToContactAction,
    sendLocationToGroupAction,
    sendLocationToCrmContactAction,
    // Poll actions
    sendPollToContactAction,
    sendPollToGroupAction,
    sendPollToChannelAction,
    sendPollToCrmContactAction,
    // Story actions
    setTextStoryAction,
    setImageStoryAction,
    setVideoStoryAction,
    // Info actions
    getGroupInfoAction,
    getChannelInfoAction,
    // Utility actions
    checkWhatsappAction,
    createCustomApiCallAction({
      auth: whatsscaleAuth,
      baseUrl: () => 'https://proxy.whatsscale.com',
      authMapping: async (auth) => ({
        'X-Api-Key': `${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    watchChannelMessagesTrigger,
    watchGroupMessagesTrigger,
    watchIncomingMessagesTrigger,
    watchSpecificGroupMessagesTrigger,
    watchSpecificChannelMessagesTrigger,
  ],
});
