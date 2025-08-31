import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

import { getSite } from "./lib/actions/get-site";
import { startDeploy } from "./lib/actions/start-deploy";
import { listSiteDeploys } from "./lib/actions/list-site-deploys";
import { listFiles } from "./lib/actions/list-files";

import { newDeployStarted } from "./lib/triggers/new-deploy-started";
import { newDeploySucceeded } from "./lib/triggers/new-deploy-succeeded";
import { newDeployFailed } from "./lib/triggers/new-deploy-failed";
import { newFormSubmission } from "./lib/triggers/new-form-submission";

export const netlifyAuth = PieceAuth.SecretText({
    displayName: "Personal Access Token",
    description: `
    To get your Personal Access Token (PAT):
    1. Go to your Netlify User Settings -> Applications.
    2. Under "Personal access tokens", select "New access token".
    3. Give it a descriptive name (e.g., "Activepieces").
    4. Set an expiration date.
    5. Click "Generate token" and copy it here.
    `,
    required: true,
    
    validate: async ({ auth }) => {
        try {
            
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.netlify.com/api/v1/sites',
                headers: {
                    Authorization: `Bearer ${auth}`,
                },
            });
            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: "Invalid Personal Access Token.",
            };
        }
    },
});



export const netlify = createPiece({
    displayName: "Netlify",
    auth: netlifyAuth, 
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/netlify.png",
    authors: [
        
    ],
    actions: [
        getSite,
        startDeploy,
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
