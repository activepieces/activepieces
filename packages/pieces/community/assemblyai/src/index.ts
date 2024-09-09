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
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/assemblyai.png',
  authors: ['AssemblyAI'],
  actions: Object.values(actions),
  triggers: [],
});
