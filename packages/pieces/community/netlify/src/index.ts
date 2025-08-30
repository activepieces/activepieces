
    import { createPiece } from "@activepieces/pieces-framework";
    import { netlifyAuth } from "./lib/common/auth";
    import { startDeploy } from "./lib/actions/start-deploy";
    import { getSite } from "./lib/actions/get-site";
    import { listSiteDeploys } from "./lib/actions/list-site-deploys";
    import { listFiles } from "./lib/actions/list-files";
    import { createSite } from "./lib/actions/create-site";
    import { listSites } from "./lib/actions/list-sites";
    import { getDeploy } from "./lib/actions/get-deploy";
    import { restoreDeploy } from "./lib/actions/restore-deploy";
    import { listForms } from "./lib/actions/list-forms";
    import { listFormSubmissions } from "./lib/actions/list-form-submissions";
    import { newDeployStarted } from "./lib/triggers/new-deploy-started";
    import { newDeploySucceeded } from "./lib/triggers/new-deploy-succeeded";
    import { newDeployFailed } from "./lib/triggers/new-deploy-failed";
    import { newFormSubmission } from "./lib/triggers/new-form-submission";

    export const netlify = createPiece({
      displayName: "Netlify",
      auth: netlifyAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/netlify.png",
      authors: [],
      actions: [
        startDeploy,
        getSite,
        listSiteDeploys,
        listFiles,
        createSite,
        listSites,
        getDeploy,
        restoreDeploy,
        listForms,
        listFormSubmissions,
      ],
      triggers: [
        newDeployStarted,
        newDeploySucceeded,
        newDeployFailed,
        newFormSubmission,
      ],
    });
    