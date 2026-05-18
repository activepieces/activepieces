
    import { createPiece } from "@activepieces/pieces-framework";
    import { netlifyAuth } from "./lib/common/auth";
    import { startDeploy } from "./lib/actions/start-deploy";
    import { getSite } from "./lib/actions/get-site";
    import { listSiteDeploys } from "./lib/actions/list-site-deploys";
    import { listFiles } from "./lib/actions/list-files";
    import { newDeployStarted } from "./lib/triggers/new-deploy-started";
    import { newDeploySucceeded } from "./lib/triggers/new-deploy-succeeded";
    import { newDeployFailed } from "./lib/triggers/new-deploy-failed";
    import { newFormSubmission } from "./lib/triggers/new-form-submission";
import { PieceCategory } from "@activepieces/shared";

    export const netlify = createPiece({
      displayName: "Netlify",
      auth: netlifyAuth,
      minimumSupportedRelease: '0.36.1',
      description: "Netlify is a platform for building and deploying websites and apps.",
      logoUrl: "https://cdn.activepieces.com/pieces/netlify.png",
      authors: ["sparkybug"],
      categories: [PieceCategory.DEVELOPER_TOOLS],
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
    