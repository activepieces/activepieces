import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { generateAsset } from './lib/actions/generate-asset';
import { getGenerationStatus } from './lib/actions/get-generation-status';
import { getRenderStatus } from './lib/actions/get-render-status';
import { listGenerationModels } from './lib/actions/list-generation-models';
import { quoteGeneration } from './lib/actions/quote-generation';
import { renderFromJson } from './lib/actions/render-from-json';
import { renderTemplate } from './lib/actions/render-template';
import { shotstackAuth } from './lib/auth';
import { shotstackApi } from './lib/common';

export const shotstack = createPiece({
  displayName: 'Shotstack',
  description:
    'Render videos, images and audio from JSON edits or saved templates, and generate AI assets, with the Shotstack API.',
  auth: shotstackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/shotstack.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['Jesus-Shotstack'],
  actions: [
    renderFromJson,
    renderTemplate,
    getRenderStatus,
    generateAsset,
    quoteGeneration,
    getGenerationStatus,
    listGenerationModels,
    createCustomApiCallAction({
      auth: shotstackAuth,
      baseUrl: (auth) => shotstackApi.baseUrl(auth?.props.environment),
      authMapping: async (auth, propsValue) =>
        shotstackApi.customCallHeaders({ apiKey: auth.props.api_key, url: propsValue['url']?.['url'] }),
    }),
  ],
  triggers: [],
});
