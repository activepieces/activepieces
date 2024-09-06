import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import * as actions from './lib/actions';

export const assemblyaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can retrieve your API Key within your AssemblyAI [Account Settings](https://www.assemblyai.com/app/account?utm_source=activepieces).',
});

export const assemblyai = createPiece({
  displayName: "AssemblyAI",
  auth: assemblyaiAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://cdn.activepieces.com/pieces/assemblyai.png",
  authors: [],
  actions: Object.values(actions),
  triggers: [],
});
