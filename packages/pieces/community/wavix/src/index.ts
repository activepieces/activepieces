import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { wavixAuth } from './lib/common/auth';
import { WAVIX_BASE_URL } from './lib/common/client';
import { sendSms } from './lib/actions/send-sms';
import { lookupNumber } from './lib/actions/lookup-number';
import { send2faCode } from './lib/actions/send-2fa-code';
import { verify2faCode } from './lib/actions/verify-2fa-code';
import { transcribeFile } from './lib/actions/transcribe-file';
import { newInboundSms } from './lib/triggers/new-inbound-sms';
import { callCompleted } from './lib/triggers/call-completed';

export const wavix = createPiece({
  displayName: 'Wavix',
  description:
    'Global voice and messaging platform. Send SMS/MMS, look up phone numbers, run 2FA verification and transcribe audio from your automations.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/wavix.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: wavixAuth,
  authors: ['nadybud'],
  actions: [
    sendSms,
    lookupNumber,
    send2faCode,
    verify2faCode,
    transcribeFile,
    createCustomApiCallAction({
      baseUrl: () => WAVIX_BASE_URL,
      auth: wavixAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newInboundSms, callCompleted],
});
