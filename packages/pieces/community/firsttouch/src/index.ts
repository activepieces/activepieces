import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { firstTouchAuth } from './lib/auth';
import { FIRSTTOUCH_BASE_URL } from './lib/common/client';
import { checkConnectionStatusAction } from './lib/actions/check-connection-status';
import { enrollContactInFlowAction } from './lib/actions/enroll-contact-in-flow';
import { sendConnectionRequestAction } from './lib/actions/send-connection-request';
import { sendMessageAction } from './lib/actions/send-message';
import { sendInmailAction } from './lib/actions/send-inmail';
import { viewProfileAction } from './lib/actions/view-profile';
import { newLinkedinReplyTrigger } from './lib/triggers/new-linkedin-reply';
import { connectionAcceptedTrigger } from './lib/triggers/connection-accepted';
import { newSocialEngagerTrigger } from './lib/triggers/new-social-engager';

export const firsttouch = createPiece({
  displayName: 'FirstTouch',
  description:
    'LinkedIn outreach for sales teams with human approval: connection checks, messages, InMails, connection requests, flows, replies and post engagers.',
  auth: firstTouchAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/firsttouch.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  authors: ['jmintz94'],
  actions: [
    checkConnectionStatusAction,
    enrollContactInFlowAction,
    sendConnectionRequestAction,
    sendMessageAction,
    sendInmailAction,
    viewProfileAction,
    createCustomApiCallAction({
      auth: firstTouchAuth,
      baseUrl: () => FIRSTTOUCH_BASE_URL,
      authMapping: async (auth) => ({
        'X-API-Key': auth.secret_text,
      }),
    }),
  ],
  triggers: [newLinkedinReplyTrigger, connectionAcceptedTrigger, newSocialEngagerTrigger],
});
