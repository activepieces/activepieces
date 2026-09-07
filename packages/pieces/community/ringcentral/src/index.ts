import { createPiece, OAuth2PropertyValue, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { ringcentralAuth } from './lib/common/auth';
import { ringcentralCommon } from './lib/common/client';

import { sendSms } from './lib/actions/send-sms';
import { makeCall } from './lib/actions/make-call';
import { sendTeamMessage } from './lib/actions/send-team-message';
import { getCallLog } from './lib/actions/get-call-log';
import { getExtensionInfo } from './lib/actions/get-extension-info';
import { getMessage } from './lib/actions/get-message';
import { downloadMessageAttachment } from './lib/actions/download-message-attachment';
import { newInboundSms } from './lib/triggers/new-inbound-sms';
import { newVoicemail } from './lib/triggers/new-voicemail';
import { newTeamMessage } from './lib/triggers/new-team-message';

export const ringcentral = createPiece({
  displayName: 'RingCentral',
  description:
    'Cloud business communications: send SMS, place calls, manage messages, and post to Team Messaging.',
  auth: ringcentralAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ringcentral.png',
  authors: ['alexandronic'],
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    sendSms,
    makeCall,
    sendTeamMessage,
    getCallLog,
    getExtensionInfo,
    getMessage,
    downloadMessageAttachment,
    createCustomApiCallAction({
      auth: ringcentralAuth,
      baseUrl: (auth) =>
        auth ? ringcentralCommon.getServerUrl(auth as OAuth2PropertyValue) : '',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newInboundSms, newVoicemail, newTeamMessage],
});
