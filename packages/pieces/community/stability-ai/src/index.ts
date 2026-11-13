import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { stabilityAiAuth } from './lib/auth';
import { creativeUpscale } from './lib/actions/creative-upscale';
import { eraseObject } from './lib/actions/erase-object';
import { generateImage } from './lib/actions/generate-image';
import { getAccountBalance } from './lib/actions/get-account-balance';
import { getAccountDetails } from './lib/actions/get-account-details';
import { getGenerationResult } from './lib/actions/get-generation-result';
import { imageToImage } from './lib/actions/image-to-image';
import { inpaint } from './lib/actions/inpaint';
import { listEngines } from './lib/actions/list-engines';
import { outpaint } from './lib/actions/outpaint';
import { removeBackground } from './lib/actions/remove-background';
import { replaceBackgroundAndRelight } from './lib/actions/replace-background-and-relight';
import { searchAndRecolor } from './lib/actions/search-and-recolor';
import { searchAndReplace } from './lib/actions/search-and-replace';
import { sketchToImage } from './lib/actions/sketch-to-image';
import { structureToImage } from './lib/actions/structure-to-image';
import { styleGuide } from './lib/actions/style-guide';
import { styleTransfer } from './lib/actions/style-transfer';
import { textToImage } from './lib/actions/text-to-image';
import { upscaleImage } from './lib/actions/upscale-image';

export const stabilityAi = createPiece({
  displayName: 'Stability AI',
  description:
    'Generate, edit, upscale and restyle images with Stability AI models such as Stable Image Ultra, Core and Stable Diffusion 3.5.',
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/stability-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['Willianwg', 'camilou', 'kishanprmr', 'MoShizzle', 'AbdulTheActivePiecer', 'khaledmashaly', 'abuaboud', 'OdaiAhmed99'],
  auth: stabilityAiAuth,
  actions: [
    generateImage,
    imageToImage,
    upscaleImage,
    creativeUpscale,
    getGenerationResult,
    eraseObject,
    inpaint,
    outpaint,
    searchAndReplace,
    searchAndRecolor,
    removeBackground,
    replaceBackgroundAndRelight,
    sketchToImage,
    structureToImage,
    styleGuide,
    styleTransfer,
    getAccountBalance,
    getAccountDetails,
    listEngines,
    textToImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stability.ai/v1',
      auth: stabilityAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_key.trim()}`,
      }),
    }),
  ],
  triggers: [],
});

export { stabilityAiAuth };
