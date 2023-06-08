import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
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

export const proma = createPiece({
  name: 'proma',
  displayName: 'Proma',
  logoUrl:
    'https://growthzilla-notes-759987269.development.catalystserverless.com/staticfiles/eb5ade4a-27dc-4d91-b80e-89807962f19d-proma-logo.png',
  version: packageJson.version,
  authors: [],
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
  triggers: [newRowAdded, dataRowUpdated, teamMemberAddedOrganization, teamMemberAddedWorkspace],
});
