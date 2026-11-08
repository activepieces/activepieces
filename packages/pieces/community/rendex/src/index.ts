import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { rendexAuth } from './lib/common/auth';
import { RENDEX_BASE_URL } from './lib/common/common';
import { renderToImage } from './lib/actions/render-to-image';
import { renderScreenshot } from './lib/actions/render-screenshot';
import { createRenderLink } from './lib/actions/create-render-link';
import { extractContent } from './lib/actions/extract-content';
import { createArtifact } from './lib/actions/create-artifact';
import { getAccount } from './lib/actions/get-account';
import { listWatches } from './lib/actions/list-watches';
import { getWatch } from './lib/actions/get-watch';
import { createWatch } from './lib/actions/create-watch';
import { testWatch } from './lib/actions/test-watch';
import { updateWatch } from './lib/actions/update-watch';
import { deleteWatch } from './lib/actions/delete-watch';
import { runWatchNow } from './lib/actions/run-watch-now';
import { listWatchRuns } from './lib/actions/list-watch-runs';
import { newWatchChange } from './lib/triggers/new-watch-change';

export const rendex = createPiece({
  displayName: 'Rendex',
  description:
    'Render HTML, a URL or Markdown to an image or PDF, extract page content, create render links and branded documents, and watch web pages for changes.',
  auth: rendexAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/rendex.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.DEVELOPER_TOOLS],
  authors: ['Dan425953'],
  actions: [
    renderToImage,
    renderScreenshot,
    createRenderLink,
    extractContent,
    createArtifact,
    getAccount,
    listWatches,
    getWatch,
    createWatch,
    testWatch,
    updateWatch,
    deleteWatch,
    runWatchNow,
    listWatchRuns,
    createCustomApiCallAction({
      baseUrl: () => RENDEX_BASE_URL,
      auth: rendexAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text.trim()}`,
      }),
    }),
  ],
  triggers: [newWatchChange],
});

export { rendexAuth };
