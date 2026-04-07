import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { stitchGoogleAuth } from './lib/auth';
import { listProjectsAction } from './lib/actions/list-projects';
import { createProjectAction } from './lib/actions/create-project';
import { listScreensAction } from './lib/actions/list-screens';
import { generateScreenAction } from './lib/actions/generate-screen';
import { getScreenAction } from './lib/actions/get-screen';
import { editScreenAction } from './lib/actions/edit-screen';
import { generateVariantsAction } from './lib/actions/generate-variants';
import { newScreenTrigger } from './lib/triggers/new-screen';

export { stitchGoogleAuth };

export const stitchGoogle = createPiece({
  displayName: 'Stitch (Google)',
  description:
    'Stitch is a Google AI-powered UI design tool. Generate mobile and web app screens from text prompts, edit designs, and explore variants — all programmatically.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.PRODUCTIVITY],
  authors: [],
  auth: stitchGoogleAuth,
  actions: [
    listProjectsAction,
    createProjectAction,
    listScreensAction,
    generateScreenAction,
    getScreenAction,
    editScreenAction,
    generateVariantsAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://stitch.googleapis.com/mcp',
      auth: stitchGoogleAuth,
      authMapping: async (auth: unknown) => ({
        'x-api-key': String(auth),
      }),
    }),
  ],
  triggers: [newScreenTrigger],
});
