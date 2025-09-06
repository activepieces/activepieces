import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createProject } from './lib/actions/create-project';
import { listVoices } from './lib/actions/list-voices';
import { textToSpeech } from './lib/actions/text-to-speech';
import { translateText } from './lib/actions/translate-text';
import { voiceChange } from './lib/actions/voice-change';

export const murfAi = createPiece({
  displayName: 'Murf-ai',
  description:
    'Murf is an AI-powered Text-to-Speech (TTS) platform that converts written text into lifelike voiceovers using a variety of voices, styles, and languages.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/murf-ai.png',
  authors: ['devroy10'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createProject,
    listVoices,
    textToSpeech,
    translateText,
    voiceChange,
  ],
  triggers: [],
});
