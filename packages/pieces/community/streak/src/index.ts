import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { streakAuth } from './lib/auth';
import { createBoxAction } from './lib/actions/create-box';
import { updateBoxAction } from './lib/actions/update-box';
import { getBoxAction } from './lib/actions/get-box';
import { listBoxesInPipelineAction } from './lib/actions/list-boxes-in-pipeline';
import { createTaskAction } from './lib/actions/create-task';
import { getPipelineAction } from './lib/actions/get-pipeline';
import { STREAK_API_ROOT } from './lib/common/client';

export const streak = createPiece({
  displayName: 'Streak',
  description: 'CRM built inside Gmail for pipelines, boxes, and task workflows.',
  auth: streakAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://logo.clearbit.com/streak.com',
  authors: ['Harmatta'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createBoxAction,
    updateBoxAction,
    getBoxAction,
    listBoxesInPipelineAction,
    createTaskAction,
    getPipelineAction,
    createCustomApiCallAction({
      baseUrl: () => STREAK_API_ROOT,
      auth: streakAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.props.api_key}:`).toString('base64')}`,
      }),
    }),
  ],
  triggers: [],
});
