import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { cancelDeploy } from './lib/actions/cancel-deploy';
import { customApiCall } from './lib/actions/custom-api-call';
import { deleteEnvVar, deleteEnvVarById, listEnvVars, listEnvVarsById, setEnvVar, setEnvVarById } from './lib/actions/env-vars';
import { getDeploy } from './lib/actions/get-deploy';
import { getSite, getSiteById } from './lib/actions/get-site';
import { listFiles, listFilesById } from './lib/actions/list-files';
import { listFormSubmissions, listFormSubmissionsById } from './lib/actions/list-form-submissions';
import { listForms, listFormsById } from './lib/actions/list-forms';
import { listSiteDeploys, listSiteDeploysById } from './lib/actions/list-site-deploys';
import { listSites } from './lib/actions/list-sites';
import { lockDeploy, unlockDeploy } from './lib/actions/lock-deploy';
import { restoreDeploy } from './lib/actions/restore-deploy';
import { startDeploy, startDeployById } from './lib/actions/start-deploy';
import { netlifyAuth } from './lib/common/auth';
import { newDeployFailed } from './lib/triggers/new-deploy-failed';
import { newDeployStarted } from './lib/triggers/new-deploy-started';
import { newDeploySucceeded } from './lib/triggers/new-deploy-succeeded';
import { newFormSubmission } from './lib/triggers/new-form-submission';

export const netlify = createPiece({
  displayName: 'Netlify',
  auth: netlifyAuth,
  minimumSupportedRelease: '0.36.1',
  description: 'Netlify is a platform for building and deploying websites and apps.',
  logoUrl: 'https://cdn.activepieces.com/pieces/netlify.png',
  authors: ['sparkybug'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  actions: [
    listSites,
    getSite,
    getSiteById,
    startDeploy,
    startDeployById,
    listSiteDeploys,
    listSiteDeploysById,
    getDeploy,
    cancelDeploy,
    restoreDeploy,
    lockDeploy,
    unlockDeploy,
    listFiles,
    listFilesById,
    listForms,
    listFormsById,
    listFormSubmissions,
    listFormSubmissionsById,
    listEnvVars,
    listEnvVarsById,
    setEnvVar,
    setEnvVarById,
    deleteEnvVar,
    deleteEnvVarById,
    customApiCall,
  ],
  triggers: [newDeployStarted, newDeploySucceeded, newDeployFailed, newFormSubmission],
});
