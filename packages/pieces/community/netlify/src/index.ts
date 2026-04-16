import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getSite } from './lib/actions/get-site'
import { listFiles } from './lib/actions/list-files'
import { listSiteDeploys } from './lib/actions/list-site-deploys'
import { startDeploy } from './lib/actions/start-deploy'
import { netlifyAuth } from './lib/common/auth'
import { newDeployFailed } from './lib/triggers/new-deploy-failed'
import { newDeployStarted } from './lib/triggers/new-deploy-started'
import { newDeploySucceeded } from './lib/triggers/new-deploy-succeeded'
import { newFormSubmission } from './lib/triggers/new-form-submission'

export const netlify = createPiece({
    displayName: 'Netlify',
    auth: netlifyAuth,
    minimumSupportedRelease: '0.36.1',
    description: 'Netlify is a platform for building and deploying websites and apps.',
    logoUrl: 'https://cdn.activepieces.com/pieces/netlify.png',
    authors: ['sparkybug'],
    categories: [PieceCategory.DEVELOPER_TOOLS],
    actions: [startDeploy, getSite, listSiteDeploys, listFiles],
    triggers: [newDeployStarted, newDeploySucceeded, newDeployFailed, newFormSubmission],
})
