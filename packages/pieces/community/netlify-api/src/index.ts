import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  startDeploy,
  getSite,
  listSiteDeploys,
  listFiles
} from './lib/actions';
import {
  newDeployStarted,
  newDeploySucceeded,
  newDeployFailed,
  newFormSubmission
} from './lib/triggers';

export const netlifyApi = createPiece({
  displayName: 'Netlify API',
  description:
    'Netlify is a platform for deploying and hosting modern web applications with continuous deployment from Git.',
  auth: PieceAuth.OAuth2({
    description: 'Authenticate with your Netlify account using OAuth2',
    authUrl: 'https://app.netlify.com/authorize',
    tokenUrl: 'https://api.netlify.com/oauth/token',
    required: true,
    scope: ['read', 'write']
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/netlify-api.png',
  authors: [],
  actions: [startDeploy, getSite, listSiteDeploys, listFiles],
  triggers: [
    newDeployStarted,
    newDeploySucceeded,
    newDeployFailed,
    newFormSubmission
  ]
});
