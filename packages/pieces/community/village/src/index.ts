import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { villageAuth } from './lib/common/auth';
import { addLeadToSequence } from './lib/actions/ai/add-lead-to-sequence';
import { addPersonToList } from './lib/actions/ai/add-person-to-list';
import { addRelationship } from './lib/actions/ai/add-relationship';
import { findCompanies } from './lib/actions/ai/find-companies';
import { findPeople } from './lib/actions/ai/find-people';
import { listNetworkCompanies } from './lib/actions/ai/list-network-companies';
import { listNetworkPeople } from './lib/actions/ai/list-network-people';
import { resolveGroupByName } from './lib/actions/ai/resolve-group-by-name';
import { resolveListByName } from './lib/actions/ai/resolve-list-by-name';
import { resolveSequenceByName } from './lib/actions/ai/resolve-sequence-by-name';
import { resolveTeamByName } from './lib/actions/ai/resolve-team-by-name';
import { getAppInfo } from './lib/actions/app/get-app-info';
import { checkCompanyPathsBulk } from './lib/actions/companies/check-company-paths-bulk';
import { checkCompanyPaths } from './lib/actions/companies/check-company-paths';
import { companiesRefresh } from './lib/actions/companies/companies-refresh';
import { enrichCompanyBulk } from './lib/actions/companies/enrich-company-bulk';
import { enrichCompany } from './lib/actions/companies/enrich-company';
import { getCompanyPaths } from './lib/actions/companies/get-company-paths';
import { listCompanies } from './lib/actions/companies/list-companies';
import { searchCompanies } from './lib/actions/companies/search-companies';
import { sortCompanies } from './lib/actions/companies/sort-companies';
import { joinGroup } from './lib/actions/groups/join-group';
import { leaveGroup } from './lib/actions/groups/leave-group';
import { listGroups } from './lib/actions/groups/list-groups';
import { upsertGroup } from './lib/actions/groups/upsert-group';
import { listIntegrations } from './lib/actions/integrations/list-integrations';
import { resyncIntegration } from './lib/actions/integrations/resync-integration';
import { updateIntegration } from './lib/actions/integrations/update-integration';
import { addListItems } from './lib/actions/lists/add-list-items';
import { checkListMembership } from './lib/actions/lists/check-list-membership';
import { createList } from './lib/actions/lists/create-list';
import { deleteList } from './lib/actions/lists/delete-list';
import { getList } from './lib/actions/lists/get-list';
import { listLists } from './lib/actions/lists/list-lists';
import { refreshList } from './lib/actions/lists/refresh-list';
import { removeListItems } from './lib/actions/lists/remove-list-items';
import { updateList } from './lib/actions/lists/update-list';
import { enrichPersonBulk } from './lib/actions/people/enrich-person-bulk';
import { enrichPersonEmailBulk } from './lib/actions/people/enrich-person-email-bulk';
import { enrichPersonEmail } from './lib/actions/people/enrich-person-email';
import { enrichPerson } from './lib/actions/people/enrich-person';
import { getPersonPathsBulk } from './lib/actions/people/get-person-paths-bulk';
import { getPersonPaths } from './lib/actions/people/get-person-paths';
import { getPersonPosts } from './lib/actions/people/get-person-posts';
import { listPeople } from './lib/actions/people/list-people';
import { peopleRefresh } from './lib/actions/people/people-refresh';
import { reverseLookupEmail } from './lib/actions/people/reverse-lookup-email';
import { searchPeople } from './lib/actions/people/search-people';
import { sortPeople } from './lib/actions/people/sort-people';
import { addSequenceLeads } from './lib/actions/sequences/add-sequence-leads';
import { archiveSequence } from './lib/actions/sequences/archive-sequence';
import { createSequence } from './lib/actions/sequences/create-sequence';
import { deleteSequenceLead } from './lib/actions/sequences/delete-sequence-lead';
import { getSequence } from './lib/actions/sequences/get-sequence';
import { listEmailActivities } from './lib/actions/sequences/list-email-activities';
import { listSequenceEmails } from './lib/actions/sequences/list-sequence-emails';
import { listSequenceLeads } from './lib/actions/sequences/list-sequence-leads';
import { listSequences } from './lib/actions/sequences/list-sequences';
import { discoverTeamsByDomain } from './lib/actions/teams/discover-teams-by-domain';
import { joinTeam } from './lib/actions/teams/join-team';
import { leaveTeam } from './lib/actions/teams/leave-team';
import { listTeams } from './lib/actions/teams/list-teams';
import { upsertTeam } from './lib/actions/teams/upsert-team';
import { getCurrentUser } from './lib/actions/user/get-current-user';
import { getUserStatus } from './lib/actions/user/get-user-status';
import { getWorkOverlapStats } from './lib/actions/user/get-work-overlap-stats';
import { importRelationshipsFromList } from './lib/actions/user/import-relationships-from-list';
import { importRelationships } from './lib/actions/user/import-relationships';
import { listWorkOverlaps } from './lib/actions/user/list-work-overlaps';
import { createWebhook } from './lib/actions/webhooks/create-webhook';
import { deleteWebhook } from './lib/actions/webhooks/delete-webhook';
import { getWebhook } from './lib/actions/webhooks/get-webhook';
import { listWebhooks } from './lib/actions/webhooks/list-webhooks';
import { updateWebhook } from './lib/actions/webhooks/update-webhook';
import { newVillageEvent } from './lib/triggers/new-village-event';

export const village = createPiece({
  displayName: 'Village',
  description: 'The Social Capital API',
  auth: villageAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/village.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
  authors: ['rafaelmuttoni'],
  actions: [
    addLeadToSequence,
    addPersonToList,
    addRelationship,
    findCompanies,
    findPeople,
    listNetworkCompanies,
    listNetworkPeople,
    resolveGroupByName,
    resolveListByName,
    resolveSequenceByName,
    resolveTeamByName,
    getAppInfo,
    checkCompanyPathsBulk,
    checkCompanyPaths,
    companiesRefresh,
    enrichCompanyBulk,
    enrichCompany,
    getCompanyPaths,
    listCompanies,
    searchCompanies,
    sortCompanies,
    joinGroup,
    leaveGroup,
    listGroups,
    upsertGroup,
    listIntegrations,
    resyncIntegration,
    updateIntegration,
    addListItems,
    checkListMembership,
    createList,
    deleteList,
    getList,
    listLists,
    refreshList,
    removeListItems,
    updateList,
    enrichPersonBulk,
    enrichPersonEmailBulk,
    enrichPersonEmail,
    enrichPerson,
    getPersonPathsBulk,
    getPersonPaths,
    getPersonPosts,
    listPeople,
    peopleRefresh,
    reverseLookupEmail,
    searchPeople,
    sortPeople,
    addSequenceLeads,
    archiveSequence,
    createSequence,
    deleteSequenceLead,
    getSequence,
    listEmailActivities,
    listSequenceEmails,
    listSequenceLeads,
    listSequences,
    discoverTeamsByDomain,
    joinTeam,
    leaveTeam,
    listTeams,
    upsertTeam,
    getCurrentUser,
    getUserStatus,
    getWorkOverlapStats,
    importRelationshipsFromList,
    importRelationships,
    listWorkOverlaps,
    createWebhook,
    deleteWebhook,
    getWebhook,
    listWebhooks,
    updateWebhook,
  ],
  triggers: [newVillageEvent],
});

export { villageAuth };
