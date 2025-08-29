import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Auth
import { netlifyAuth } from './lib/common/auth';

// Actions
import { startDeployAction } from './lib/actions/start-deploy';
import { getSiteAction } from './lib/actions/get-site';
import { listSiteDeploysAction } from './lib/actions/list-site-deploys';
import { listFilesAction } from './lib/actions/list-files';

// Triggers
import { newDeployStartedTrigger } from './lib/triggers/new-deploy-started';
import { newDeploySucceededTrigger } from './lib/triggers/new-deploy-succeeded';
import { newDeployFailedTrigger } from './lib/triggers/new-deploy-failed';
import { newFormSubmissionTrigger } from './lib/triggers/new-form-submission';

const markdownDescription = `
Netlify is a platform for building, deploying, and managing static websites and frontend applications with continuous deployment from Git repositories.

## Authentication

To get your Personal Access Token:

1. Log in to your Netlify account
2. Go to **User Settings** > **Applications** > **Personal Access Tokens**
3. Click **New access token**
4. Give it a descriptive name and click **Generate token**
5. Copy the token and paste it here

## Features

### Write Actions
- **Start Deploy** - Trigger a new deployment for a site
- **Get Site** - Retrieve information about a specific site
- **List Site Deploys** - Get a list of deployments for a site
- **List Files** - List files in a specific deployment

### Triggers
- **New Deploy Started** - Fires when a new deployment begins
- **New Deploy Succeeded** - Fires when a deployment completes successfully
- **New Deploy Failed** - Fires when a deployment fails
- **New Form Submission** - Fires when a form is submitted on your site

For more information, visit the [Netlify API documentation](https://docs.netlify.com/api/get-started/).
`;

export const netlify = createPiece({
  displayName: 'Netlify',
  description: 'Platform for building, deploying, and managing static websites and frontend applications',
  auth: netlifyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/netlify.png',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.WEBSITE_BUILDERS],
  authors: ['activepieces'],
  actions: [
    // Write Actions
    startDeployAction,
    getSiteAction,
    listSiteDeploysAction,
    listFilesAction,
    
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: () => 'https://api.netlify.com/api/v1',
      auth: netlifyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    newDeployStartedTrigger,
    newDeploySucceededTrigger,
    newDeployFailedTrigger,
    newFormSubmissionTrigger,
  ],
});
