import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { moxieCreateClientAction } from './lib/actions/create-client';
import { moxieCreateContactAction } from './lib/actions/create-contact';
import { moxieCreateProjectAction } from './lib/actions/create-project';
import { moxieCreateTaskAction } from './lib/actions/create-task';
import { moxieListClientsAction } from './lib/actions/list-clients';
import { moxieListInvoiceTemplatesAction } from './lib/actions/list-invoice-templates';
import { moxieListPipelineStagesAction } from './lib/actions/list-pipeline-stages';
import { moxieListWorkspaceUsersAction } from './lib/actions/list-workspace-users';
import { moxieSearchClientsAction } from './lib/actions/search-clients';
import { moxieSearchContactsAction } from './lib/actions/search-contacts';
import { moxieSearchProjectsAction } from './lib/actions/search-projects';
import { moxieCRMTriggers } from './lib/triggers';
import { moxieCRMAuth } from './lib/auth';
export const moxieCrm = createPiece({
  displayName: 'Moxie',
  description: 'CRM build for the freelancers.',

  auth: moxieCRMAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moxie-crm.png',
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    moxieCreateClientAction,
    moxieCreateContactAction,
    moxieCreateTaskAction,
    moxieCreateProjectAction,
    moxieListClientsAction,
    moxieSearchClientsAction,
    moxieSearchContactsAction,
    moxieSearchProjectsAction,
    moxieListPipelineStagesAction,
    moxieListWorkspaceUsersAction,
    moxieListInvoiceTemplatesAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth?.props.baseUrl ?? ''),
      auth: moxieCRMAuth,
      authMapping: async (auth) => ({
        'X-API-KEY': (auth.props.apiKey),
      }),
    }),
  ],
  triggers: moxieCRMTriggers,
});
