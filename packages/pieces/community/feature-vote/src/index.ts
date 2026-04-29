import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { featuresVoteAuth } from './lib/auth';
import { createFeatureAction } from './lib/actions/create-feature';
import { listFeaturesAction } from './lib/actions/list-features';
import { updateFeatureStatusAction } from './lib/actions/update-feature-status';
import { createReleaseAction } from './lib/actions/create-release';
import { newFeatureTrigger } from './lib/triggers/new-feature';


export const featureVote = createPiece({
  displayName: 'FeaturesVote',
  description: 'Product feedback and feature voting board.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/feature-vote.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Eamateli', 'sanket-a11y'],
  auth: featuresVoteAuth,
  actions: [
    createFeatureAction,
    listFeaturesAction,
    updateFeatureStatusAction,
    createReleaseAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://features.vote/api',
      auth: featuresVoteAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newFeatureTrigger],
});