import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { waflyAuth } from './lib/common';
import { sendText } from './lib/actions/send-text';
import { sendMedia } from './lib/actions/send-media';
import { sendPoll } from './lib/actions/send-poll';
import { getInstanceStatus } from './lib/actions/get-instance-status';
import { checkPhones } from './lib/actions/check-phones';
import { createGroup } from './lib/actions/create-group';
import { setMessageBuffer } from './lib/actions/set-message-buffer';
import { setTranscription } from './lib/actions/set-transcription';
import { newMessage } from './lib/triggers/new-message';

export { waflyAuth };

export const wafly = createPiece({
  displayName: 'Wafly',
  description:
    'WhatsApp API that groups a person\'s split messages into one event and transcribes voice notes, so an AI agent answers once with the whole question.',
  auth: waflyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://raw.githubusercontent.com/iagovelasco3/n8n-nodes-wafly/main/nodes/Wafly/wafly.svg',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['iagovelasco3'],
  actions: [
    sendText,
    sendMedia,
    sendPoll,
    createGroup,
    checkPhones,
    getInstanceStatus,
    setMessageBuffer,
    setTranscription,
  ],
  triggers: [newMessage],
});
