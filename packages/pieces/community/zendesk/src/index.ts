import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { zendeskAuth } from './lib/auth';
import { getZendeskAuthorizationHeader, getZendeskBaseUrl } from './lib/common/client';
import { newTicketInView } from './lib/trigger/new-ticket-in-view';
import { newTicket } from './lib/trigger/new-ticket';
import { updatedTicket } from './lib/trigger/updated-ticket';
import { tagAddedToTicket } from './lib/trigger/tag-added-to-ticket';
import { newOrganization } from './lib/trigger/new-organization';
import { newUser } from './lib/trigger/new-user';
import { newSuspendedTicket } from './lib/trigger/new-suspended-ticket';
import { newActionOnTicket } from './lib/trigger/new-action-on-ticket';
import { newGroup } from './lib/trigger/new-group';
import { tagAddedToUser } from './lib/trigger/tag-added-to-user';
import { createTicketAction } from './lib/actions/create-ticket';
import { updateTicketAction } from './lib/actions/update-ticket';
import { addTagToTicketAction } from './lib/actions/add-tag-to-ticket';
import { removeTagFromTicketAction } from './lib/actions/remove-tag-from-ticket';
import { attachFileToTicketAction } from './lib/actions/attach-file-to-ticket';
import { addCommentToTicketAction } from './lib/actions/add-comment-to-ticket';
import { createOrganizationAction } from './lib/actions/create-organization';
import { updateOrganizationAction } from './lib/actions/update-organization';
import { createUserAction } from './lib/actions/create-user';
import { deleteUserAction } from './lib/actions/delete-user';
import { findOrganizationAction } from './lib/actions/find-organization';
import { findTicketsAction } from './lib/actions/find-tickets';
import { findUserAction } from './lib/actions/find-user';
import { findAgentAction } from './lib/actions/find-agent';
import { findGroupAction } from './lib/actions/find-group';
import { findLatestCommentAction } from './lib/actions/find-latest-comment';
import { updateUserAction } from './lib/actions/update-user';
import { zendeskGetAutomation } from './lib/actions/ai/admin/get-automation';
import { zendeskGetSatisfactionRating } from './lib/actions/ai/admin/get-satisfaction-rating';
import { zendeskGetTicketSlaMetrics } from './lib/actions/ai/admin/get-ticket-sla-metrics';
import { zendeskGetTicketTrigger } from './lib/actions/ai/admin/get-ticket-trigger';
import { zendeskListAutomations } from './lib/actions/ai/admin/list-automations';
import { zendeskListSatisfactionRatings } from './lib/actions/ai/admin/list-satisfaction-ratings';
import { zendeskListSlaPolicies } from './lib/actions/ai/admin/list-sla-policies';
import { zendeskListTicketTriggers } from './lib/actions/ai/admin/list-ticket-triggers';
import { zendeskSearchAutomations } from './lib/actions/ai/admin/search-automations';
import { zendeskSearchTicketTriggers } from './lib/actions/ai/admin/search-ticket-triggers';
import { zendeskCreateCustomObjectRecord } from './lib/actions/ai/custom-objects/create-custom-object-record';
import { zendeskDeleteCustomObjectRecord } from './lib/actions/ai/custom-objects/delete-custom-object-record';
import { zendeskGetCustomObjectRecord } from './lib/actions/ai/custom-objects/get-custom-object-record';
import { zendeskListCustomObjectFields } from './lib/actions/ai/custom-objects/list-custom-object-fields';
import { zendeskListCustomObjectRecords } from './lib/actions/ai/custom-objects/list-custom-object-records';
import { zendeskListCustomObjects } from './lib/actions/ai/custom-objects/list-custom-objects';
import { zendeskSearchCustomObjectRecords } from './lib/actions/ai/custom-objects/search-custom-object-records';
import { zendeskUpdateCustomObjectRecord } from './lib/actions/ai/custom-objects/update-custom-object-record';
import { zendeskUpsertCustomObjectRecord } from './lib/actions/ai/custom-objects/upsert-custom-object-record';
import { zendeskListGroupUsers } from './lib/actions/ai/groups/list-group-users';
import { zendeskListGroups } from './lib/actions/ai/groups/list-groups';
import { zendeskListBrands } from './lib/actions/ai/lookups/list-brands';
import { zendeskListCustomStatuses } from './lib/actions/ai/lookups/list-custom-statuses';
import { zendeskListOrganizationFields } from './lib/actions/ai/lookups/list-organization-fields';
import { zendeskListTicketFields } from './lib/actions/ai/lookups/list-ticket-fields';
import { zendeskListTicketForms } from './lib/actions/ai/lookups/list-ticket-forms';
import { zendeskListUserFields } from './lib/actions/ai/lookups/list-user-fields';
import { zendeskGetMacro } from './lib/actions/ai/macros/get-macro';
import { zendeskListMacros } from './lib/actions/ai/macros/list-macros';
import { zendeskPreviewMacroOnTicket } from './lib/actions/ai/macros/preview-macro-on-ticket';
import { zendeskSearchMacros } from './lib/actions/ai/macros/search-macros';
import { zendeskAddOrganizationTags } from './lib/actions/ai/organizations/add-organization-tags';
import { zendeskCreateOrUpdateOrganization } from './lib/actions/ai/organizations/create-or-update-organization';
import { zendeskCreateOrganizationMembership } from './lib/actions/ai/organizations/create-organization-membership';
import { zendeskCreateOrganization } from './lib/actions/ai/organizations/create-organization';
import { zendeskDeleteOrganizationMembership } from './lib/actions/ai/organizations/delete-organization-membership';
import { zendeskDeleteOrganization } from './lib/actions/ai/organizations/delete-organization';
import { zendeskGetOrganizationTags } from './lib/actions/ai/organizations/get-organization-tags';
import { zendeskGetOrganization } from './lib/actions/ai/organizations/get-organization';
import { zendeskListOrganizationMemberships } from './lib/actions/ai/organizations/list-organization-memberships';
import { zendeskListOrganizationUsers } from './lib/actions/ai/organizations/list-organization-users';
import { zendeskListOrganizations } from './lib/actions/ai/organizations/list-organizations';
import { zendeskRemoveOrganizationTags } from './lib/actions/ai/organizations/remove-organization-tags';
import { zendeskSearchOrganizations } from './lib/actions/ai/organizations/search-organizations';
import { zendeskUpdateOrganization } from './lib/actions/ai/organizations/update-organization';
import { zendeskCountSearchResults } from './lib/actions/ai/search/count-search-results';
import { zendeskCountViewTickets } from './lib/actions/ai/search/count-view-tickets';
import { zendeskListViewTickets } from './lib/actions/ai/search/list-view-tickets';
import { zendeskListViews } from './lib/actions/ai/search/list-views';
import { zendeskSearch } from './lib/actions/ai/search/search';
import { zendeskAddTicketComment } from './lib/actions/ai/tickets/add-ticket-comment';
import { zendeskAddTicketTags } from './lib/actions/ai/tickets/add-ticket-tags';
import { zendeskCreateManyTickets } from './lib/actions/ai/tickets/create-many-tickets';
import { zendeskCreateTicket } from './lib/actions/ai/tickets/create-ticket';
import { zendeskDeleteTicket } from './lib/actions/ai/tickets/delete-ticket';
import { zendeskGetAttachment } from './lib/actions/ai/tickets/get-attachment';
import { zendeskGetJobStatus } from './lib/actions/ai/tickets/get-job-status';
import { zendeskGetManyTickets } from './lib/actions/ai/tickets/get-many-tickets';
import { zendeskGetTicketConversationLog } from './lib/actions/ai/tickets/get-ticket-conversation-log';
import { zendeskGetTicketMetrics } from './lib/actions/ai/tickets/get-ticket-metrics';
import { zendeskGetTicketTags } from './lib/actions/ai/tickets/get-ticket-tags';
import { zendeskGetTicket } from './lib/actions/ai/tickets/get-ticket';
import { zendeskListDeletedTickets } from './lib/actions/ai/tickets/list-deleted-tickets';
import { zendeskListProblemTickets } from './lib/actions/ai/tickets/list-problem-tickets';
import { zendeskListSuspendedTickets } from './lib/actions/ai/tickets/list-suspended-tickets';
import { zendeskListTicketAudits } from './lib/actions/ai/tickets/list-ticket-audits';
import { zendeskListTicketComments } from './lib/actions/ai/tickets/list-ticket-comments';
import { zendeskListTicketEmailCcs } from './lib/actions/ai/tickets/list-ticket-email-ccs';
import { zendeskListTicketFollowers } from './lib/actions/ai/tickets/list-ticket-followers';
import { zendeskListTicketIncidents } from './lib/actions/ai/tickets/list-ticket-incidents';
import { zendeskListTickets } from './lib/actions/ai/tickets/list-tickets';
import { zendeskMakeCommentPrivate } from './lib/actions/ai/tickets/make-comment-private';
import { zendeskMarkTicketsAsSpam } from './lib/actions/ai/tickets/mark-tickets-as-spam';
import { zendeskMergeTickets } from './lib/actions/ai/tickets/merge-tickets';
import { zendeskRecoverSuspendedTickets } from './lib/actions/ai/tickets/recover-suspended-tickets';
import { zendeskRedactComment } from './lib/actions/ai/tickets/redact-comment';
import { zendeskRemoveTicketTags } from './lib/actions/ai/tickets/remove-ticket-tags';
import { zendeskRestoreTicket } from './lib/actions/ai/tickets/restore-ticket';
import { zendeskUpdateManyTickets } from './lib/actions/ai/tickets/update-many-tickets';
import { zendeskUpdateTicket } from './lib/actions/ai/tickets/update-ticket';
import { zendeskAddUserTags } from './lib/actions/ai/users/add-user-tags';
import { zendeskCreateOrUpdateUser } from './lib/actions/ai/users/create-or-update-user';
import { zendeskCreateUserIdentity } from './lib/actions/ai/users/create-user-identity';
import { zendeskCreateUser } from './lib/actions/ai/users/create-user';
import { zendeskDeleteUserIdentity } from './lib/actions/ai/users/delete-user-identity';
import { zendeskDeleteUser } from './lib/actions/ai/users/delete-user';
import { zendeskGetCurrentUser } from './lib/actions/ai/users/get-current-user';
import { zendeskGetManyUsers } from './lib/actions/ai/users/get-many-users';
import { zendeskGetUserTags } from './lib/actions/ai/users/get-user-tags';
import { zendeskGetUser } from './lib/actions/ai/users/get-user';
import { zendeskListUserGroups } from './lib/actions/ai/users/list-user-groups';
import { zendeskListUserIdentities } from './lib/actions/ai/users/list-user-identities';
import { zendeskListUsers } from './lib/actions/ai/users/list-users';
import { zendeskMakeUserIdentityPrimary } from './lib/actions/ai/users/make-user-identity-primary';
import { zendeskMergeUsers } from './lib/actions/ai/users/merge-users';
import { zendeskRemoveUserTags } from './lib/actions/ai/users/remove-user-tags';
import { zendeskSearchUsers } from './lib/actions/ai/users/search-users';
import { zendeskUpdateUserIdentity } from './lib/actions/ai/users/update-user-identity';
import { zendeskUpdateUser } from './lib/actions/ai/users/update-user';

export const zendesk = createPiece({
  displayName: 'Zendesk',
  description: 'Customer service software and support ticket system',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk.png',
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","aryel780","onyedikachi-david","murex971"],
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: zendeskAuth,
  actions: [
    createTicketAction,
    updateTicketAction,
    addTagToTicketAction,
    removeTagFromTicketAction,
    attachFileToTicketAction,
    addCommentToTicketAction,
    createOrganizationAction,
    updateOrganizationAction,
    createUserAction,
    deleteUserAction,
    findOrganizationAction,
    findTicketsAction,
    findUserAction,
    findAgentAction,
    findGroupAction,
    findLatestCommentAction,
    updateUserAction,
    zendeskGetAutomation,
    zendeskGetSatisfactionRating,
    zendeskGetTicketSlaMetrics,
    zendeskGetTicketTrigger,
    zendeskListAutomations,
    zendeskListSatisfactionRatings,
    zendeskListSlaPolicies,
    zendeskListTicketTriggers,
    zendeskSearchAutomations,
    zendeskSearchTicketTriggers,
    zendeskCreateCustomObjectRecord,
    zendeskDeleteCustomObjectRecord,
    zendeskGetCustomObjectRecord,
    zendeskListCustomObjectFields,
    zendeskListCustomObjectRecords,
    zendeskListCustomObjects,
    zendeskSearchCustomObjectRecords,
    zendeskUpdateCustomObjectRecord,
    zendeskUpsertCustomObjectRecord,
    zendeskListGroupUsers,
    zendeskListGroups,
    zendeskListBrands,
    zendeskListCustomStatuses,
    zendeskListOrganizationFields,
    zendeskListTicketFields,
    zendeskListTicketForms,
    zendeskListUserFields,
    zendeskGetMacro,
    zendeskListMacros,
    zendeskPreviewMacroOnTicket,
    zendeskSearchMacros,
    zendeskAddOrganizationTags,
    zendeskCreateOrUpdateOrganization,
    zendeskCreateOrganizationMembership,
    zendeskCreateOrganization,
    zendeskDeleteOrganizationMembership,
    zendeskDeleteOrganization,
    zendeskGetOrganizationTags,
    zendeskGetOrganization,
    zendeskListOrganizationMemberships,
    zendeskListOrganizationUsers,
    zendeskListOrganizations,
    zendeskRemoveOrganizationTags,
    zendeskSearchOrganizations,
    zendeskUpdateOrganization,
    zendeskCountSearchResults,
    zendeskCountViewTickets,
    zendeskListViewTickets,
    zendeskListViews,
    zendeskSearch,
    zendeskAddTicketComment,
    zendeskAddTicketTags,
    zendeskCreateManyTickets,
    zendeskCreateTicket,
    zendeskDeleteTicket,
    zendeskGetAttachment,
    zendeskGetJobStatus,
    zendeskGetManyTickets,
    zendeskGetTicketConversationLog,
    zendeskGetTicketMetrics,
    zendeskGetTicketTags,
    zendeskGetTicket,
    zendeskListDeletedTickets,
    zendeskListProblemTickets,
    zendeskListSuspendedTickets,
    zendeskListTicketAudits,
    zendeskListTicketComments,
    zendeskListTicketEmailCcs,
    zendeskListTicketFollowers,
    zendeskListTicketIncidents,
    zendeskListTickets,
    zendeskMakeCommentPrivate,
    zendeskMarkTicketsAsSpam,
    zendeskMergeTickets,
    zendeskRecoverSuspendedTickets,
    zendeskRedactComment,
    zendeskRemoveTicketTags,
    zendeskRestoreTicket,
    zendeskUpdateManyTickets,
    zendeskUpdateTicket,
    zendeskAddUserTags,
    zendeskCreateOrUpdateUser,
    zendeskCreateUserIdentity,
    zendeskCreateUser,
    zendeskDeleteUserIdentity,
    zendeskDeleteUser,
    zendeskGetCurrentUser,
    zendeskGetManyUsers,
    zendeskGetUserTags,
    zendeskGetUser,
    zendeskListUserGroups,
    zendeskListUserIdentities,
    zendeskListUsers,
    zendeskMakeUserIdentityPrimary,
    zendeskMergeUsers,
    zendeskRemoveUserTags,
    zendeskSearchUsers,
    zendeskUpdateUserIdentity,
    zendeskUpdateUser,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? getZendeskBaseUrl(auth) : ''),
      auth: zendeskAuth,
      authMapping: async (auth) => ({
        Authorization: getZendeskAuthorizationHeader(auth),
      }),
    }),
  ],
  triggers: [newTicketInView, newTicket, updatedTicket, tagAddedToTicket, newOrganization, newUser, newSuspendedTicket, newActionOnTicket, newGroup, tagAddedToUser],
});
