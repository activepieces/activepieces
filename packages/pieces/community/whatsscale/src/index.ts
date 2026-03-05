import { createPiece } from '@activepieces/pieces-framework';
import { whatsscaleAuth } from './lib/auth';

// Sprint 2: Text actions
import { sendTextManualAction } from './lib/actions/messaging/send-text-manual';
import { sendTextToContactAction } from './lib/actions/messaging/send-text-to-contact';
import { sendTextToGroupAction } from './lib/actions/messaging/send-text-to-group';
import { sendTextToChannelAction } from './lib/actions/messaging/send-text-to-channel';
import { sendTextToCrmContactAction } from './lib/actions/messaging/send-text-to-crm-contact';

// Sprint 3: Image actions
import { sendImageToContactAction } from './lib/actions/messaging/send-image-to-contact';
import { sendImageToGroupAction } from './lib/actions/messaging/send-image-to-group';
import { sendImageToChannelAction } from './lib/actions/messaging/send-image-to-channel';
import { sendImageToCrmContactAction } from './lib/actions/messaging/send-image-to-crm-contact';
import { sendImageManualAction } from './lib/actions/messaging/send-image-manual';

// Sprint 4: Video actions
import { sendVideoToContactAction } from './lib/actions/messaging/send-video-to-contact';
import { sendVideoToGroupAction } from './lib/actions/messaging/send-video-to-group';
import { sendVideoToChannelAction } from './lib/actions/messaging/send-video-to-channel';
import { sendVideoToCrmContactAction } from './lib/actions/messaging/send-video-to-crm-contact';
import { sendVideoManualAction } from './lib/actions/messaging/send-video-manual';

// Sprint 4: Document actions
import { sendDocumentToContactAction } from './lib/actions/messaging/send-document-to-contact';
import { sendDocumentToGroupAction } from './lib/actions/messaging/send-document-to-group';
import { sendDocumentToCrmContactAction } from './lib/actions/messaging/send-document-to-crm-contact';

// Sprint 5: Location actions
import { sendLocationToContactAction } from './lib/actions/messaging/send-location-to-contact';
import { sendLocationToGroupAction } from './lib/actions/messaging/send-location-to-group';
import { sendLocationToCrmContactAction } from './lib/actions/messaging/send-location-to-crm-contact';

// Sprint 5: Poll actions
import { sendPollToContactAction } from './lib/actions/messaging/send-poll-to-contact';
import { sendPollToGroupAction } from './lib/actions/messaging/send-poll-to-group';
import { sendPollToChannelAction } from './lib/actions/messaging/send-poll-to-channel';
import { sendPollToCrmContactAction } from './lib/actions/messaging/send-poll-to-crm-contact';

// Sprint 6: Story actions
import { setTextStoryAction } from './lib/actions/stories/set-text-story';
import { setImageStoryAction } from './lib/actions/stories/set-image-story';
import { setVideoStoryAction } from './lib/actions/stories/set-video-story';

export const whatsscale = createPiece({
  displayName: 'WhatsScale',
  auth: whatsscaleAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://whatsscale.com/logo.png',
  authors: ['mahidhark'],
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
  ],
  triggers: [],
});
