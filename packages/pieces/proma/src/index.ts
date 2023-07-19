import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { addPromaRow } from './lib/actions/create-item';
import { newRowAdded } from './lib/triggers/new-row';
import { dataRowUpdated } from './lib/triggers/row-updated';
import { addPromaTable } from './lib/actions/add-table';
import { addPromaTableColumn } from './lib/actions/add-table-column';
import { getPromaWorkspaces } from './lib/actions/get-workspaces';
import { getPromaProjects } from './lib/actions/get-projects';
import { getPromaTableRows } from './lib/actions/get-items';
import { getPromaTableColumns } from './lib/actions/get-table-columns';
import { teamMemberAddedOrganization } from './lib/triggers/team-member-added-org';
import { updatePromaRow } from './lib/actions/update-item';
import { teamMemberAddedWorkspace } from './lib/triggers/team-member-added-ws';

export const promaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter API Key from Proma App',
  required: true,
});

export const proma = createPiece({
  displayName: 'Proma',
  logoUrl:
    'https://pipeline-759987269.catalystserverless.com/server/pipeline_function/public/folder/9417000001056763/file/18160000000066090',
  authors: ["kritan9"],
  actions: [
    addPromaRow,
    updatePromaRow,
    addPromaTable,
    addPromaTableColumn,
    getPromaWorkspaces,
    getPromaProjects,
    getPromaTableColumns,
    getPromaTableRows,
  ],
  auth: promaAuth,
  triggers: [
    newRowAdded,
    dataRowUpdated,
    teamMemberAddedOrganization,
    teamMemberAddedWorkspace,
  ],
});
