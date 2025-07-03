import { createPiece } from '@activepieces/pieces-framework';
import * as actions from './lib/actions';
import { assemblyaiAuth } from './lib/auth';
import { PieceCategory } from '@activepieces/shared';

export const assemblyai = createPiece({
  displayName: 'AssemblyAI',
  auth: assemblyaiAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description:
    "Transcribe and extract data from audio using AssemblyAI's Speech AI.",
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/assemblyai.png',
  authors: ['AssemblyAI'],
  actions: [
    actions.uploadFile,
    actions.transcribe,
    actions.getTranscript,
    actions.getSentences,
    actions.getParagraphs,
    actions.getSubtitles,
    actions.getRedactedAudio,
    actions.wordSearch,
    actions.listTranscripts,
    actions.deleteTranscript,
    actions.lemurTask,
    actions.getLemurResponse,
    actions.purgeLemurRequestData,
    actions.customApiCall,
  ],
  triggers: [],
});
