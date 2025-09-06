import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { murftAuth } from './lib/auth';
import { textToSpeech } from './lib/actions/text-to-speech';
import { translateText } from './lib/actions/translate-text';
import { createProject } from './lib/actions/create-project';
import { listVoices } from './lib/actions/list-voices';
import { voiceChange } from './lib/actions/voice-change';

export const murf = createPiece({
  displayName: 'Murf',
  logoUrl: 'https://cdn.activepieces.com/pieces/murf.png',
  authors: ['sudarshan-magar7'],
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: murftAuth,
  actions: [
    textToSpeech,
    translateText,
    createProject,
    listVoices,
    voiceChange,
  ],
  triggers: [],
});