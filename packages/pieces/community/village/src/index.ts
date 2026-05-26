import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { villageAuth } from './lib/common/auth';

// App actions
import { getAppInfo } from './lib/actions/app/get-app-info';

// Companies actions
import { checkCompanyPaths } from './lib/actions/companies/check-company-paths';
import { companiesRefresh } from './lib/actions/companies/companies-refresh';
import { enrichCompany } from './lib/actions/companies/enrich-company';
import { enrichCompanyBulk } from './lib/actions/companies/enrich-company-bulk';
import { getCompanyPaths } from './lib/actions/companies/get-company-paths';
import { listCompanies } from './lib/actions/companies/list-companies';
import { searchCompanies } from './lib/actions/companies/search-companies';
import { sortCompanies } from './lib/actions/companies/sort-companies';

// Groups actions
import { joinGroup } from './lib/actions/groups/join-group';
import { leaveGroup } from './lib/actions/groups/leave-group';
import { listGroups } from './lib/actions/groups/list-groups';
import { upsertGroup } from './lib/actions/groups/upsert-group';

// Integrations actions
import { createIntegration } from './lib/actions/integrations/create-integration';
import { listIntegrations } from './lib/actions/integrations/list-integrations';
import { resyncIntegration } from './lib/actions/integrations/resync-integration';
import { updateIntegration } from './lib/actions/integrations/update-integration';

// Lists actions
import { addListItems } from './lib/actions/lists/add-list-items';
import { checkListMembership } from './lib/actions/lists/check-list-membership';
import { createList } from './lib/actions/lists/create-list';
import { deleteList } from './lib/actions/lists/delete-list';
import { getList } from './lib/actions/lists/get-list';
import { listLists } from './lib/actions/lists/list-lists';
import { removeListItems } from './lib/actions/lists/remove-list-items';
import { updateList } from './lib/actions/lists/update-list';

// People actions
import { enrichPerson } from './lib/actions/people/enrich-person';
import { enrichPersonBulk } from './lib/actions/people/enrich-person-bulk';
import { enrichPersonEmail } from './lib/actions/people/enrich-person-email';
import { enrichPersonEmailBulk } from './lib/actions/people/enrich-person-email-bulk';
import { getPersonPaths } from './lib/actions/people/get-person-paths';
import { getPersonPathsBulk } from './lib/actions/people/get-person-paths-bulk';
import { listPeople } from './lib/actions/people/list-people';
import { peopleRefresh } from './lib/actions/people/people-refresh';
import { searchPeople } from './lib/actions/people/search-people';
import { sortPeople } from './lib/actions/people/sort-people';

// Teams actions
import { joinTeam } from './lib/actions/teams/join-team';
import { leaveTeam } from './lib/actions/teams/leave-team';
import { listTeams } from './lib/actions/teams/list-teams';
import { upsertTeam } from './lib/actions/teams/upsert-team';

// User actions
import { getCurrentUser } from './lib/actions/user/get-current-user';
import { importRelationships } from './lib/actions/user/import-relationships';

export { villageAuth };

export const village = createPiece({
  displayName: 'Village',
  description: 'The Social Capital API',
  auth: villageAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/village.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
  authors: ['rafaelmuttoni'],
  actions: [
    getAppInfo,
    checkCompanyPaths,
    companiesRefresh,
    enrichCompany,
    enrichCompanyBulk,
    getCompanyPaths,
    listCompanies,
    searchCompanies,
    sortCompanies,
    joinGroup,
    leaveGroup,
    listGroups,
    upsertGroup,
    createIntegration,
    listIntegrations,
    resyncIntegration,
    updateIntegration,
    addListItems,
    checkListMembership,
    createList,
    deleteList,
    getList,
    listLists,
    removeListItems,
    updateList,
    enrichPerson,
    enrichPersonBulk,
    enrichPersonEmail,
    enrichPersonEmailBulk,
    getPersonPaths,
    getPersonPathsBulk,
    listPeople,
    peopleRefresh,
    searchPeople,
    sortPeople,
    joinTeam,
    leaveTeam,
    listTeams,
    upsertTeam,
    getCurrentUser,
    importRelationships,
  ],
  triggers: [],
});
