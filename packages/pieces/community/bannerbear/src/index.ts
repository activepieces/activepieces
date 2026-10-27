import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { bannerbearCreateImageAction } from './lib/actions/create-image';
import { createImageFromJsonAction } from './lib/actions/create-image-from-json';
import { getImageAction } from './lib/actions/get-image';
import { listImagesAction } from './lib/actions/list-images';
import { listTemplatesAction } from './lib/actions/list-templates';
import { getTemplateAction } from './lib/actions/get-template';
import { updateTemplateAction } from './lib/actions/update-template';
import { createScreenshotAction } from './lib/actions/create-screenshot';
import { createCollectionAction } from './lib/actions/create-collection';
import { createAnimatedGifAction } from './lib/actions/create-animated-gif';
import { getAccountAction } from './lib/actions/get-account';
import { newImageCompletedTrigger } from './lib/triggers/new-image-completed';
import { bannerbearAuth } from './lib/auth';
import { bannerbearClient } from './lib/common/client';

export const bannerbear = createPiece({
  displayName: 'Bannerbear',
  description: 'Automate image generation',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/bannerbear.png',
  categories: [PieceCategory.MARKETING],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","OdaiAhmed99"],
  auth: bannerbearAuth,
  actions: [
    bannerbearCreateImageAction,
    createImageFromJsonAction,
    getImageAction,
    listImagesAction,
    listTemplatesAction,
    getTemplateAction,
    updateTemplateAction,
    createScreenshotAction,
    createCollectionAction,
    createAnimatedGifAction,
    getAccountAction,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        auth ? bannerbearClient.getBaseUrl(auth.secret_text) : 'https://api.bannerbear.com/v2',
      auth: bannerbearAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text.trim()}`,
      }),
    }),
  ],
  triggers: [newImageCompletedTrigger],
});
