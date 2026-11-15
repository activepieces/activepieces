import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { whatsscaleAuth } from './lib/auth';

// Human — messaging actions with a dropdown-picked recipient (covered by an ai/ atomic)
import { sendTextToContactAction } from './lib/actions/human/messaging/send-text-to-contact';
import { sendTextToGroupAction } from './lib/actions/human/messaging/send-text-to-group';
import { sendTextToChannelAction } from './lib/actions/human/messaging/send-text-to-channel';
import { sendTextToCrmContactAction } from './lib/actions/human/messaging/send-text-to-crm-contact';
import { sendImageToContactAction } from './lib/actions/human/messaging/send-image-to-contact';
import { sendImageToGroupAction } from './lib/actions/human/messaging/send-image-to-group';
import { sendImageToChannelAction } from './lib/actions/human/messaging/send-image-to-channel';
import { sendImageToCrmContactAction } from './lib/actions/human/messaging/send-image-to-crm-contact';
import { sendVideoToContactAction } from './lib/actions/human/messaging/send-video-to-contact';
import { sendVideoToGroupAction } from './lib/actions/human/messaging/send-video-to-group';
import { sendVideoToChannelAction } from './lib/actions/human/messaging/send-video-to-channel';
import { sendVideoToCrmContactAction } from './lib/actions/human/messaging/send-video-to-crm-contact';
import { sendDocumentToContactAction } from './lib/actions/human/messaging/send-document-to-contact';
import { sendDocumentToGroupAction } from './lib/actions/human/messaging/send-document-to-group';
import { sendDocumentToCrmContactAction } from './lib/actions/human/messaging/send-document-to-crm-contact';

// Human — CRM actions with a dropdown-picked contact (covered by an ai/ atomic)
import { getCrmContactAction } from './lib/actions/human/crm/get-contact';
import { updateCrmContactAction } from './lib/actions/human/crm/update-contact';
import { deleteCrmContactAction } from './lib/actions/human/crm/delete-contact';
import { addCrmContactTagAction } from './lib/actions/human/crm/add-contact-tag';
import { removeCrmContactTagAction } from './lib/actions/human/crm/remove-contact-tag';

// Both — CRM actions with no dropdown target, nothing to split
import { createCrmContactAction } from './lib/actions/both/crm/create-contact';
import { findCrmContactByPhoneAction } from './lib/actions/both/crm/find-contact-by-phone';
import { listCrmContactsAction } from './lib/actions/both/crm/list-contacts';
import { listCrmTagsAction } from './lib/actions/both/crm/list-tags';

// Both — messaging actions with no dropdown target at all (no human twin exists to conflict with)
import { sendAudioManualAction } from './lib/actions/both/messaging/send-audio';
import { sendLocationManualAction } from './lib/actions/both/messaging/send-location';
import { sendPollManualAction } from './lib/actions/both/messaging/send-poll';

// Human — group management via dropdowns
import { addParticipantsToGroupAction } from './lib/actions/human/groups/add-participants';
import { removeParticipantsFromGroupAction } from './lib/actions/human/groups/remove-participants';
import { promoteAdminsInGroupAction } from './lib/actions/human/groups/promote-admins';
import { demoteAdminsInGroupAction } from './lib/actions/human/groups/demote-admins';
import { leaveSelectedGroupAction } from './lib/actions/human/groups/leave';
import { listParticipantsInGroupAction } from './lib/actions/human/groups/list-participants';

// AI — group management by raw group ID
import { addGroupParticipantsAction } from './lib/actions/ai/groups/add-participants';
import { removeGroupParticipantsAction } from './lib/actions/ai/groups/remove-participants';
import { promoteGroupAdminsAction } from './lib/actions/ai/groups/promote-admins';
import { demoteGroupAdminsAction } from './lib/actions/ai/groups/demote-admins';
import { leaveGroupAction } from './lib/actions/ai/groups/leave';
import { listGroupParticipantsAction } from './lib/actions/ai/groups/list-participants';

// Both — status and utility actions
import { postTextStatusAction } from './lib/actions/both/status/post-text';
import { postImageStatusAction } from './lib/actions/both/status/post-image';
import { postVideoStatusAction } from './lib/actions/both/status/post-video';
import { checkWhatsappAction } from './lib/actions/both/utility/check-whatsapp';
import { listSessionsAction } from './lib/actions/both/utility/list-sessions';
import { listWhatsappContactsAction } from './lib/actions/both/utility/list-whatsapp-contacts';
import { listWhatsappGroupsAction } from './lib/actions/both/utility/list-whatsapp-groups';

// AI — messaging actions that take a recipient ID directly, no builder dropdown
// (a human dropdown twin exists for these four content types, so the raw-ID version is ai-only)
import { sendTextManualAction } from './lib/actions/ai/messaging/send-text';
import { sendImageManualAction } from './lib/actions/ai/messaging/send-image';
import { sendVideoManualAction } from './lib/actions/ai/messaging/send-video';
import { sendDocumentManualAction } from './lib/actions/ai/messaging/send-document';

// AI — CRM actions that take a contact ID directly, no builder dropdown
import { getCrmContactByIdAction } from './lib/actions/ai/crm/get-contact';
import { updateCrmContactByIdAction } from './lib/actions/ai/crm/update-contact';
import { deleteCrmContactByIdAction } from './lib/actions/ai/crm/delete-contact';
import { addCrmContactTagByIdAction } from './lib/actions/ai/crm/add-contact-tag';
import { removeCrmContactTagByIdAction } from './lib/actions/ai/crm/remove-contact-tag';

// Triggers
import { watchIncomingMessagesTrigger } from './lib/triggers/watch-incoming-messages';
import { watchGroupMessagesTrigger } from './lib/triggers/watch-group-messages';
import { watchChannelMessagesTrigger } from './lib/triggers/watch-channel-messages';
import { watchSpecificGroupMessagesTrigger } from './lib/triggers/watch-specific-group-messages';
import { watchSpecificChannelMessagesTrigger } from './lib/triggers/watch-specific-channel-messages';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const whatsscale = createPiece({
  displayName: 'WhatsScale',
  auth: whatsscaleAuth,
  minimumSupportedRelease: '0.87.0',
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
    // Human — messaging (dropdown-picked recipient, covered by an ai/ atomic)
    sendTextToContactAction,
    sendTextToGroupAction,
    sendTextToChannelAction,
    sendTextToCrmContactAction,
    sendImageToContactAction,
    sendImageToGroupAction,
    sendImageToChannelAction,
    sendImageToCrmContactAction,
    sendVideoToContactAction,
    sendVideoToGroupAction,
    sendVideoToChannelAction,
    sendVideoToCrmContactAction,
    sendDocumentToContactAction,
    sendDocumentToGroupAction,
    sendDocumentToCrmContactAction,
    // Human — CRM (dropdown-picked contact, covered by an ai/ atomic)
    getCrmContactAction,
    updateCrmContactAction,
    deleteCrmContactAction,
    addCrmContactTagAction,
    removeCrmContactTagAction,
    // Both — CRM (no dropdown target, nothing to split)
    createCrmContactAction,
    findCrmContactByPhoneAction,
    listCrmContactsAction,
    listCrmTagsAction,
    // Both — messaging with no dropdown target (no human twin exists to conflict with)
    sendAudioManualAction,
    sendLocationManualAction,
    sendPollManualAction,
    // Human — group management via dropdowns
    addParticipantsToGroupAction,
    removeParticipantsFromGroupAction,
    promoteAdminsInGroupAction,
    demoteAdminsInGroupAction,
    leaveSelectedGroupAction,
    listParticipantsInGroupAction,
    // AI — group management by raw group ID
    addGroupParticipantsAction,
    removeGroupParticipantsAction,
    promoteGroupAdminsAction,
    demoteGroupAdminsAction,
    leaveGroupAction,
    listGroupParticipantsAction,
    // Both — status and utility
    postTextStatusAction,
    postImageStatusAction,
    postVideoStatusAction,
    checkWhatsappAction,
    listSessionsAction,
    listWhatsappContactsAction,
    listWhatsappGroupsAction,
    // AI — messaging (a human dropdown twin already covers these four content types)
    sendTextManualAction,
    sendImageManualAction,
    sendVideoManualAction,
    sendDocumentManualAction,
    // AI — CRM
    getCrmContactByIdAction,
    updateCrmContactByIdAction,
    deleteCrmContactByIdAction,
    addCrmContactTagByIdAction,
    removeCrmContactTagByIdAction,
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
