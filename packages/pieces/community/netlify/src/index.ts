import { PieceAuth, createPiece, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { startDeploy } from "./lib/actions/start-deploy";
import { getSite } from "./lib/actions/get-site";
import { listSiteDeploys } from "./lib/actions/list-site-deploys";
import { listFiles } from "./lib/actions/list-files";

import { newDeployStarted } from "./lib/triggers/new-deploy-started";
import { newDeploySucceeded } from "./lib/triggers/new-deploy-succeeded";
import { newDeployFailed } from "./lib/triggers/new-deploy-failed";
import { newFormSubmission } from "./lib/triggers/new-form-submission";

// Define the OAuth2 authentication object for Netlify
export const netlifyAuth = PieceAuth.OAuth2({
    description: `
    To get your credentials, please follow these steps:
    1. Log in to your Netlify account.
    2. Go to **User settings > Applications**.
    3. Click **New OAuth app**.
    4. Fill in the application details:
       - **Name:** Choose a name for your application (e.g., "Activepieces").
       - **Redirect URI:** Paste the Redirect URL from your Activepieces credentials dialog.
    5. Click **Save**. You will receive a **Client ID** and a **Client Secret**.
    `,
    authUrl: "https://app.netlify.com/authorize",
    tokenUrl: "https://api.netlify.com/oauth/token",
    required: true,
    scope: [], 
});


export const netlify = createPiece({
    displayName: "Netlify",
    description: "Build, deploy, and manage modern web projects",
    auth: netlifyAuth, // Use the new auth object
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/netlify.png",
    categories: [PieceCategory.DEVELOPER_TOOLS],
    authors: [
        
    ],
    actions: [
        startDeploy,
        getSite,
        listSiteDeploys,
        listFiles,
    ],
    triggers: [
        newDeployStarted,
        newDeploySucceeded,
        newDeployFailed,
        newFormSubmission,
    ],
});