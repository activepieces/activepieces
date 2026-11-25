import { zohoDeskAddAccountFollowersAction } from './accounts/add-account-followers';
import { zohoDeskAssociateAccountProductsAction } from './accounts/associate-account-products';
import { zohoDeskCountAccountsAction } from './accounts/count-accounts';
import { zohoDeskCreateAccountAction } from './accounts/create-account';
import { zohoDeskCreateAccountCommentAction } from './accounts/create-account-comment';
import { zohoDeskDeleteAccountAttachmentAction } from './accounts/delete-account-attachment';
import { zohoDeskDeleteAccountCommentAction } from './accounts/delete-account-comment';
import { zohoDeskDeleteAccountsAction } from './accounts/delete-accounts';
import { zohoDeskGetAccountAction } from './accounts/get-account';
import { zohoDeskGetAccountCommentAction } from './accounts/get-account-comment';
import { zohoDeskGetAccountStatisticsAction } from './accounts/get-account-statistics';
import { zohoDeskGetAgentTimeSummaryAction } from './time-tracking/get-agent-time-summary';
import { zohoDeskGetArticleAction } from './knowledge-base/get-article';
import { zohoDeskGetCallAction } from './activities/get-call';
import { zohoDeskGetCallCommentAction } from './activities/get-call-comment';
import { zohoDeskGetContactAction } from './contacts/get-contact';
import { zohoDeskGetContactCommentAction } from './contacts/get-contact-comment';
import { zohoDeskGetContactStatisticsAction } from './contacts/get-contact-statistics';
import { zohoDeskGetContactTimeSummaryAction } from './time-tracking/get-contact-time-summary';
import { zohoDeskGetContactsByIdsAction } from './contacts/get-contacts-by-ids';
import { zohoDeskGetContractAction } from './contracts/get-contract';
import { zohoDeskGetContractCommentAction } from './contracts/get-contract-comment';
import { zohoDeskGetCurrentAgentAction } from './organization/get-current-agent';
import { zohoDeskGetDepartmentAction } from './organization/get-department';
import { zohoDeskGetEventAction } from './activities/get-event';
import { zohoDeskGetEventCommentAction } from './activities/get-event-comment';
import { zohoDeskGetLatestTicketThreadAction } from './threads/get-latest-ticket-thread';
import { zohoDeskGetOrganizationAction } from './organization/get-organization';
import { zohoDeskGetProductAction } from './products/get-product';
import { zohoDeskGetRoleAction } from './organization/get-role';
import { zohoDeskGetRolesByIdsAction } from './organization/get-roles-by-ids';
import { zohoDeskGetSuggestedArticlesAction } from './tickets/get-suggested-articles';
import { zohoDeskGetTaskAction } from './tasks/get-task';
import { zohoDeskGetTaskCommentAction } from './tasks/get-task-comment';
import { zohoDeskGetTaskTimeEntryAction } from './time-tracking/get-task-time-entry';
import { zohoDeskGetTaskTimeSummaryAction } from './time-tracking/get-task-time-summary';
import { zohoDeskGetTaskTimerAction } from './time-tracking/get-task-timer';
import { zohoDeskGetTeamAction } from './organization/get-team';
import { zohoDeskGetTicketAction } from './tickets/get-ticket';
import { zohoDeskGetTicketApprovalAction } from './tickets/get-ticket-approval';
import { zohoDeskGetTicketCommentAction } from './ticket-comments/get-ticket-comment';
import { zohoDeskGetTicketCommentHistoryAction } from './ticket-comments/get-ticket-comment-history';
import { zohoDeskGetTicketMetricsAction } from './tickets/get-ticket-metrics';
import { zohoDeskGetTicketResolutionAction } from './tickets/get-ticket-resolution';
import { zohoDeskGetTicketThreadAction } from './threads/get-ticket-thread';
import { zohoDeskGetTicketTimeEntryAction } from './time-tracking/get-ticket-time-entry';
import { zohoDeskGetTicketTimeSummaryAction } from './time-tracking/get-ticket-time-summary';
import { zohoDeskGetTicketTimerAction } from './time-tracking/get-ticket-timer';
import { zohoDeskGetUserAction } from './help-center/get-user';
import { zohoDeskInviteContactToHelpCenterAction } from './contacts/invite-contact-to-help-center';
import { zohoDeskLinkArticlesToTicketAction } from './tickets/link-articles-to-ticket';
import { zohoDeskListAccountAttachmentsAction } from './accounts/list-account-attachments';
import { zohoDeskListAccountCommentsAction } from './accounts/list-account-comments';
import { zohoDeskListAccountContactsAction } from './accounts/list-account-contacts';
import { zohoDeskListAccountContractsAction } from './accounts/list-account-contracts';
import { zohoDeskListAccountFollowersAction } from './accounts/list-account-followers';
import { zohoDeskListAccountHistoryAction } from './accounts/list-account-history';
import { zohoDeskListAccountProductsAction } from './accounts/list-account-products';
import { zohoDeskListAccountSlasAction } from './accounts/list-account-slas';
import { zohoDeskListAccountTicketsAction } from './accounts/list-account-tickets';
import { zohoDeskListAccountTimeEntriesAction } from './time-tracking/list-account-time-entries';
import { zohoDeskListAccountsAction } from './accounts/list-accounts';
import { zohoDeskListAgentTimeEntriesAction } from './time-tracking/list-agent-time-entries';
import { zohoDeskListAgentsAction } from './organization/list-agents';
import { zohoDeskListArticlesAction } from './knowledge-base/list-articles';
import { zohoDeskListBadgesAction } from './help-center/list-badges';
import { zohoDeskListCallCommentsAction } from './activities/list-call-comments';
import { zohoDeskListCallsAction } from './activities/list-calls';
import { zohoDeskListContactAccountsAction } from './contacts/list-contact-accounts';
import { zohoDeskListContactAttachmentsAction } from './contacts/list-contact-attachments';
import { zohoDeskListContactCommentsAction } from './contacts/list-contact-comments';
import { zohoDeskListContactFollowersAction } from './contacts/list-contact-followers';
import { zohoDeskListContactHelpCentersAction } from './contacts/list-contact-help-centers';
import { zohoDeskListContactHistoryAction } from './contacts/list-contact-history';
import { zohoDeskListContactProductsAction } from './contacts/list-contact-products';
import { zohoDeskListContactProfilesAction } from './contacts/list-contact-profiles';
import { zohoDeskListContactTicketsAction } from './contacts/list-contact-tickets';
import { zohoDeskListContactTimeEntriesAction } from './time-tracking/list-contact-time-entries';
import { zohoDeskListContactsAction } from './contacts/list-contacts';
import { zohoDeskListContractCommentsAction } from './contracts/list-contract-comments';
import { zohoDeskListContractsAction } from './contracts/list-contracts';
import { zohoDeskListDepartmentAgentsAction } from './organization/list-department-agents';
import { zohoDeskListDepartmentTeamsAction } from './organization/list-department-teams';
import { zohoDeskListDepartmentsAction } from './organization/list-departments';
import { zohoDeskListEventAttachmentsAction } from './activities/list-event-attachments';
import { zohoDeskListEventCommentsAction } from './activities/list-event-comments';
import { zohoDeskListEventsAction } from './activities/list-events';
import { zohoDeskListFieldsAction } from './organization/list-fields';
import { zohoDeskListHelpCenterGroupsAction } from './help-center/list-help-center-groups';
import { zohoDeskListHelpCentersAction } from './help-center/list-help-centers';
import { zohoDeskListLabelsAction } from './help-center/list-labels';
import { zohoDeskListOrganizationsAction } from './organization/list-organizations';
import { zohoDeskListProductAccountsAction } from './products/list-product-accounts';
import { zohoDeskListProductAttachmentsAction } from './products/list-product-attachments';
import { zohoDeskListProductContactsAction } from './products/list-product-contacts';
import { zohoDeskListProductTicketsAction } from './products/list-product-tickets';
import { zohoDeskListProductsAction } from './products/list-products';
import { zohoDeskListReplyAddressesAction } from './threads/list-reply-addresses';
import { zohoDeskListRolesAction } from './organization/list-roles';
import { zohoDeskListSupportPlansAction } from './contracts/list-support-plans';
import { zohoDeskListTaskActiveTimersAction } from './time-tracking/list-task-active-timers';
import { zohoDeskListTaskAttachmentsAction } from './tasks/list-task-attachments';
import { zohoDeskListTaskCommentsAction } from './tasks/list-task-comments';
import { zohoDeskListTaskTimeEntriesAction } from './time-tracking/list-task-time-entries';
import { zohoDeskListTasksAction } from './tasks/list-tasks';
import { zohoDeskListTeamMembersAction } from './organization/list-team-members';
import { zohoDeskListTicketActiveTimersAction } from './time-tracking/list-ticket-active-timers';
import { zohoDeskListTicketActivitiesAction } from './tickets/list-ticket-activities';
import { zohoDeskListTicketApprovalsAction } from './tickets/list-ticket-approvals';
import { zohoDeskListTicketAttachmentsAction } from './ticket-comments/list-ticket-attachments';
import { zohoDeskListTicketCallsAction } from './tickets/list-ticket-calls';
import { zohoDeskListTicketCommentsAction } from './ticket-comments/list-ticket-comments';
import { zohoDeskListTicketConversationsAction } from './threads/list-ticket-conversations';
import { zohoDeskListTicketEventsAction } from './tickets/list-ticket-events';
import { zohoDeskListTicketFollowersAction } from './tickets/list-ticket-followers';
import { zohoDeskListTicketHistoryAction } from './tickets/list-ticket-history';
import { zohoDeskListTicketPinsAction } from './tickets/list-ticket-pins';
import { zohoDeskListTicketResolutionHistoryAction } from './tickets/list-ticket-resolution-history';
import { zohoDeskListTicketTagsAction } from './tickets/list-ticket-tags';
import { zohoDeskListTicketTasksAction } from './tasks/list-ticket-tasks';
import { zohoDeskListTicketThreadsAction } from './threads/list-ticket-threads';
import { zohoDeskListTicketTimeEntriesAction } from './time-tracking/list-ticket-time-entries';
import { zohoDeskListTicketTimeEntriesByBillingTypeAction } from './time-tracking/list-ticket-time-entries-by-billing-type';
import { zohoDeskListTicketsAction } from './tickets/list-tickets';
import { zohoDeskListUserBadgesAction } from './help-center/list-user-badges';
import { zohoDeskListUserGroupsAction } from './help-center/list-user-groups';
import { zohoDeskListUserLabelsAction } from './help-center/list-user-labels';
import { zohoDeskListUsersAction } from './help-center/list-users';
import { zohoDeskListViewsAction } from './organization/list-views';
import { zohoDeskMarkContactsSpamAction } from './contacts/mark-contacts-spam';
import { zohoDeskMarkTicketReadAction } from './tickets/mark-ticket-read';
import { zohoDeskMarkTicketUnreadAction } from './tickets/mark-ticket-unread';
import { zohoDeskMarkTicketsSpamAction } from './tickets/mark-tickets-spam';
import { zohoDeskMergeAccountsAction } from './accounts/merge-accounts';
import { zohoDeskMergeContactsAction } from './contacts/merge-contacts';
import { zohoDeskMergeTicketsAction } from './tickets/merge-tickets';
import { zohoDeskMoveTicketAction } from './tickets/move-ticket';
import { zohoDeskRejectContactHelpCenterAccessAction } from './contacts/reject-contact-help-center-access';
import { zohoDeskRemoveAccountFollowersAction } from './accounts/remove-account-followers';
import { zohoDeskRemoveContactFollowersAction } from './contacts/remove-contact-followers';
import { zohoDeskRemoveTicketFollowersAction } from './tickets/remove-ticket-followers';
import { zohoDeskRemoveTicketTagsAction } from './tickets/remove-ticket-tags';
import { zohoDeskRemoveUserBadgesAction } from './help-center/remove-user-badges';
import { zohoDeskRemoveUserGroupsAction } from './help-center/remove-user-groups';
import { zohoDeskRemoveUserLabelsAction } from './help-center/remove-user-labels';
import { zohoDeskSearchAction } from './organization/search';
import { zohoDeskSearchAccountsAction } from './accounts/search-accounts';
import { zohoDeskSearchActivitiesAction } from './activities/search-activities';
import { zohoDeskSearchArticlesAction } from './knowledge-base/search-articles';
import { zohoDeskSearchCallsAction } from './activities/search-calls';
import { zohoDeskSearchContactsAction } from './contacts/search-contacts';
import { zohoDeskSearchEventsAction } from './activities/search-events';
import { zohoDeskSearchProductsAction } from './products/search-products';
import { zohoDeskSearchTasksAction } from './tasks/search-tasks';
import { zohoDeskSearchTicketsAction } from './tickets/search-tickets';
import { zohoDeskSendTicketReplyAction } from './threads/send-ticket-reply';
import { zohoDeskSetAccountSlaAction } from './accounts/set-account-sla';
import { zohoDeskUnpinTicketPinAction } from './tickets/unpin-ticket-pin';
import { zohoDeskUpdateAccountAction } from './accounts/update-account';
import { zohoDeskUpdateAccountCommentAction } from './accounts/update-account-comment';
import { zohoDeskUpdateCallAction } from './activities/update-call';
import { zohoDeskUpdateCallCommentAction } from './activities/update-call-comment';
import { zohoDeskUpdateContactAction } from './contacts/update-contact';
import { zohoDeskUpdateContactCommentAction } from './contacts/update-contact-comment';
import { zohoDeskUpdateContractAction } from './contracts/update-contract';
import { zohoDeskUpdateContractCommentAction } from './contracts/update-contract-comment';
import { zohoDeskUpdateEventAction } from './activities/update-event';
import { zohoDeskUpdateEventCommentAction } from './activities/update-event-comment';
import { zohoDeskUpdateManyAccountsAction } from './accounts/update-many-accounts';
import { zohoDeskUpdateManyCallsAction } from './activities/update-many-calls';
import { zohoDeskUpdateManyContactsAction } from './contacts/update-many-contacts';
import { zohoDeskUpdateManyContractsAction } from './contracts/update-many-contracts';
import { zohoDeskUpdateManyEventsAction } from './activities/update-many-events';
import { zohoDeskUpdateManyTasksAction } from './tasks/update-many-tasks';
import { zohoDeskUpdateManyTicketsAction } from './tickets/update-many-tickets';
import { zohoDeskUpdateProductAction } from './products/update-product';
import { zohoDeskUpdateTaskAction } from './tasks/update-task';
import { zohoDeskUpdateTaskCommentAction } from './tasks/update-task-comment';
import { zohoDeskUpdateTaskTimeEntryAction } from './time-tracking/update-task-time-entry';
import { zohoDeskUpdateTicketAction } from './tickets/update-ticket';
import { zohoDeskUpdateTicketApprovalAction } from './tickets/update-ticket-approval';
import { zohoDeskUpdateTicketCommentAction } from './ticket-comments/update-ticket-comment';
import { zohoDeskUpdateTicketResolutionAction } from './tickets/update-ticket-resolution';
import { zohoDeskUpdateTicketTimeEntryAction } from './time-tracking/update-ticket-time-entry';
import { zohoDeskUpdateUserAction } from './help-center/update-user';
import { zohoDeskUploadAccountAttachmentAction } from './accounts/upload-account-attachment';
import { zohoDeskCreateCallAction } from './activities/create-call';
import { zohoDeskCreateCallCommentAction } from './activities/create-call-comment';
import { zohoDeskCreateEventAction } from './activities/create-event';
import { zohoDeskCreateEventCommentAction } from './activities/create-event-comment';
import { zohoDeskDeleteCallAttachmentAction } from './activities/delete-call-attachment';
import { zohoDeskDeleteCallCommentAction } from './activities/delete-call-comment';
import { zohoDeskDeleteCallsAction } from './activities/delete-calls';
import { zohoDeskDeleteEventAttachmentAction } from './activities/delete-event-attachment';
import { zohoDeskDeleteEventsAction } from './activities/delete-events';
import { zohoDeskDownloadEventAttachmentAction } from './activities/download-event-attachment';
import { zohoDeskUploadCallAttachmentAction } from './activities/upload-call-attachment';
import { zohoDeskUploadEventAttachmentAction } from './activities/upload-event-attachment';
import { zohoDeskAddContactFollowersAction } from './contacts/add-contact-followers';
import { zohoDeskApproveContactHelpCenterAccessAction } from './contacts/approve-contact-help-center-access';
import { zohoDeskAssociateContactAccountsAction } from './contacts/associate-contact-accounts';
import { zohoDeskAssociateContactProductsAction } from './contacts/associate-contact-products';
import { zohoDeskCountContactsAction } from './contacts/count-contacts';
import { zohoDeskCreateContactAction } from './contacts/create-contact';
import { zohoDeskCreateContactCommentAction } from './contacts/create-contact-comment';
import { zohoDeskDeleteContactAttachmentAction } from './contacts/delete-contact-attachment';
import { zohoDeskDeleteContactCommentAction } from './contacts/delete-contact-comment';
import { zohoDeskDeleteContactsAction } from './contacts/delete-contacts';
import { zohoDeskDeleteSpamContactsAction } from './contacts/delete-spam-contacts';
import { zohoDeskDissociateContactAccountsAction } from './contacts/dissociate-contact-accounts';
import { zohoDeskUploadContactAttachmentAction } from './contacts/upload-contact-attachment';
import { zohoDeskCountContractsAction } from './contracts/count-contracts';
import { zohoDeskCreateContractAction } from './contracts/create-contract';
import { zohoDeskCreateContractCommentAction } from './contracts/create-contract-comment';
import { zohoDeskDeleteContractCommentAction } from './contracts/delete-contract-comment';
import { zohoDeskDownloadContractCommentAttachmentAction } from './contracts/download-contract-comment-attachment';
import { zohoDeskAddUserBadgesAction } from './help-center/add-user-badges';
import { zohoDeskAddUserGroupsAction } from './help-center/add-user-groups';
import { zohoDeskAssignUserLabelsAction } from './help-center/assign-user-labels';
import { zohoDeskCountAgentsAction } from './organization/count-agents';
import { zohoDeskCountAgentsByTypeAction } from './organization/count-agents-by-type';
import { zohoDeskCountDepartmentsAction } from './organization/count-departments';
import { zohoDeskCountRolesAction } from './organization/count-roles';
import { zohoDeskFindAgentByEmailAction } from './organization/find-agent-by-email';
import { zohoDeskGetAgentAction } from './organization/get-agent';
import { zohoDeskAssociateProductAccountsAction } from './products/associate-product-accounts';
import { zohoDeskAssociateProductContactsAction } from './products/associate-product-contacts';
import { zohoDeskCreateProductAction } from './products/create-product';
import { zohoDeskDeleteProductAttachmentAction } from './products/delete-product-attachment';
import { zohoDeskDeleteProductsAction } from './products/delete-products';
import { zohoDeskFindDuplicateProductsAction } from './products/find-duplicate-products';
import { zohoDeskUploadProductAttachmentAction } from './products/upload-product-attachment';
import { zohoDeskCountTasksAction } from './tasks/count-tasks';
import { zohoDeskCreateTaskAction } from './tasks/create-task';
import { zohoDeskCreateTaskCommentAction } from './tasks/create-task-comment';
import { zohoDeskDeleteTaskAttachmentAction } from './tasks/delete-task-attachment';
import { zohoDeskDeleteTasksAction } from './tasks/delete-tasks';
import { zohoDeskDownloadTaskAttachmentAction } from './tasks/download-task-attachment';
import { zohoDeskUploadTaskAttachmentAction } from './tasks/upload-task-attachment';
import { zohoDeskCreateDraftReplyAction } from './threads/create-draft-reply';
import { zohoDeskDownloadThreadAttachmentAction } from './threads/download-thread-attachment';
import { zohoDeskCreateTicketCommentAction } from './ticket-comments/create-ticket-comment';
import { zohoDeskDeleteTicketAttachmentAction } from './ticket-comments/delete-ticket-attachment';
import { zohoDeskDeleteTicketCommentAction } from './ticket-comments/delete-ticket-comment';
import { zohoDeskUploadTicketAttachmentAction } from './ticket-comments/upload-ticket-attachment';
import { zohoDeskAddTicketFollowersAction } from './tickets/add-ticket-followers';
import { zohoDeskAddTicketTagsAction } from './tickets/add-ticket-tags';
import { zohoDeskCloseTicketsAction } from './tickets/close-tickets';
import { zohoDeskCountTicketsAction } from './tickets/count-tickets';
import { zohoDeskCreateTicketAction } from './tickets/create-ticket';
import { zohoDeskCreateTicketApprovalAction } from './tickets/create-ticket-approval';
import { zohoDeskCreateTicketPinAction } from './tickets/create-ticket-pin';
import { zohoDeskDeleteSpamTicketsAction } from './tickets/delete-spam-tickets';
import { zohoDeskDeleteTicketResolutionAction } from './tickets/delete-ticket-resolution';
import { zohoDeskDeleteTicketsAction } from './tickets/delete-tickets';
import { zohoDeskAddTaskTimeEntryAction } from './time-tracking/add-task-time-entry';
import { zohoDeskAddTicketTimeEntryAction } from './time-tracking/add-ticket-time-entry';
import { zohoDeskControlTaskTimerAction } from './time-tracking/control-task-timer';
import { zohoDeskControlTicketTimerAction } from './time-tracking/control-ticket-timer';
import { zohoDeskDeleteTicketTimeEntryAction } from './time-tracking/delete-ticket-time-entry';
import { zohoDeskGetAccountTimeSummaryAction } from './time-tracking/get-account-time-summary';
import { zohoDeskGetAgentTimeEntryAction } from './time-tracking/get-agent-time-entry';

export const zohoDeskAiActions = [
	zohoDeskListTicketsAction,
	zohoDeskGetTicketAction,
	zohoDeskCreateTicketAction,
	zohoDeskUpdateTicketAction,
	zohoDeskSearchTicketsAction,
	zohoDeskDeleteTicketsAction,
	zohoDeskCloseTicketsAction,
	zohoDeskUpdateManyTicketsAction,
	zohoDeskMergeTicketsAction,
	zohoDeskMoveTicketAction,
	zohoDeskListTicketHistoryAction,
	zohoDeskGetTicketMetricsAction,
	zohoDeskGetTicketResolutionAction,
	zohoDeskUpdateTicketResolutionAction,
	zohoDeskDeleteTicketResolutionAction,
	zohoDeskCountTicketsAction,
	zohoDeskListTicketTagsAction,
	zohoDeskAddTicketTagsAction,
	zohoDeskRemoveTicketTagsAction,
	zohoDeskGetSuggestedArticlesAction,
	zohoDeskLinkArticlesToTicketAction,
	zohoDeskMarkTicketsSpamAction,
	zohoDeskDeleteSpamTicketsAction,
	zohoDeskListTicketFollowersAction,
	zohoDeskAddTicketFollowersAction,
	zohoDeskRemoveTicketFollowersAction,
	zohoDeskListTicketActivitiesAction,
	zohoDeskListTicketCallsAction,
	zohoDeskListTicketEventsAction,
	zohoDeskListTicketResolutionHistoryAction,
	zohoDeskMarkTicketReadAction,
	zohoDeskMarkTicketUnreadAction,
	zohoDeskListTicketPinsAction,
	zohoDeskCreateTicketPinAction,
	zohoDeskUnpinTicketPinAction,
	zohoDeskListTicketApprovalsAction,
	zohoDeskCreateTicketApprovalAction,
	zohoDeskGetTicketApprovalAction,
	zohoDeskUpdateTicketApprovalAction,
	zohoDeskListTicketThreadsAction,
	zohoDeskGetTicketThreadAction,
	zohoDeskGetLatestTicketThreadAction,
	zohoDeskListTicketConversationsAction,
	zohoDeskListReplyAddressesAction,
	zohoDeskSendTicketReplyAction,
	zohoDeskCreateDraftReplyAction,
	zohoDeskDownloadThreadAttachmentAction,
	zohoDeskListTicketCommentsAction,
	zohoDeskGetTicketCommentAction,
	zohoDeskCreateTicketCommentAction,
	zohoDeskUpdateTicketCommentAction,
	zohoDeskDeleteTicketCommentAction,
	zohoDeskGetTicketCommentHistoryAction,
	zohoDeskListTicketAttachmentsAction,
	zohoDeskUploadTicketAttachmentAction,
	zohoDeskDeleteTicketAttachmentAction,
	zohoDeskListContactsAction,
	zohoDeskGetContactAction,
	zohoDeskCreateContactAction,
	zohoDeskUpdateContactAction,
	zohoDeskDeleteContactsAction,
	zohoDeskSearchContactsAction,
	zohoDeskGetContactsByIdsAction,
	zohoDeskCountContactsAction,
	zohoDeskUpdateManyContactsAction,
	zohoDeskListContactAccountsAction,
	zohoDeskListContactTicketsAction,
	zohoDeskListContactProductsAction,
	zohoDeskAssociateContactAccountsAction,
	zohoDeskDissociateContactAccountsAction,
	zohoDeskAssociateContactProductsAction,
	zohoDeskListContactAttachmentsAction,
	zohoDeskUploadContactAttachmentAction,
	zohoDeskDeleteContactAttachmentAction,
	zohoDeskListContactCommentsAction,
	zohoDeskGetContactCommentAction,
	zohoDeskCreateContactCommentAction,
	zohoDeskUpdateContactCommentAction,
	zohoDeskDeleteContactCommentAction,
	zohoDeskListContactFollowersAction,
	zohoDeskAddContactFollowersAction,
	zohoDeskRemoveContactFollowersAction,
	zohoDeskListContactHistoryAction,
	zohoDeskGetContactStatisticsAction,
	zohoDeskMergeContactsAction,
	zohoDeskMarkContactsSpamAction,
	zohoDeskDeleteSpamContactsAction,
	zohoDeskInviteContactToHelpCenterAction,
	zohoDeskApproveContactHelpCenterAccessAction,
	zohoDeskRejectContactHelpCenterAccessAction,
	zohoDeskListContactHelpCentersAction,
	zohoDeskListContactProfilesAction,
	zohoDeskListAccountsAction,
	zohoDeskGetAccountAction,
	zohoDeskCreateAccountAction,
	zohoDeskUpdateAccountAction,
	zohoDeskDeleteAccountsAction,
	zohoDeskSearchAccountsAction,
	zohoDeskCountAccountsAction,
	zohoDeskUpdateManyAccountsAction,
	zohoDeskListAccountContactsAction,
	zohoDeskListAccountTicketsAction,
	zohoDeskListAccountProductsAction,
	zohoDeskListAccountContractsAction,
	zohoDeskListAccountSlasAction,
	zohoDeskSetAccountSlaAction,
	zohoDeskAssociateAccountProductsAction,
	zohoDeskListAccountAttachmentsAction,
	zohoDeskUploadAccountAttachmentAction,
	zohoDeskDeleteAccountAttachmentAction,
	zohoDeskListAccountCommentsAction,
	zohoDeskGetAccountCommentAction,
	zohoDeskCreateAccountCommentAction,
	zohoDeskUpdateAccountCommentAction,
	zohoDeskDeleteAccountCommentAction,
	zohoDeskListAccountFollowersAction,
	zohoDeskAddAccountFollowersAction,
	zohoDeskRemoveAccountFollowersAction,
	zohoDeskListAccountHistoryAction,
	zohoDeskGetAccountStatisticsAction,
	zohoDeskMergeAccountsAction,
	zohoDeskListTasksAction,
	zohoDeskListTicketTasksAction,
	zohoDeskGetTaskAction,
	zohoDeskSearchTasksAction,
	zohoDeskCountTasksAction,
	zohoDeskCreateTaskAction,
	zohoDeskUpdateTaskAction,
	zohoDeskDeleteTasksAction,
	zohoDeskUpdateManyTasksAction,
	zohoDeskListTaskCommentsAction,
	zohoDeskGetTaskCommentAction,
	zohoDeskCreateTaskCommentAction,
	zohoDeskUpdateTaskCommentAction,
	zohoDeskListTaskAttachmentsAction,
	zohoDeskUploadTaskAttachmentAction,
	zohoDeskDeleteTaskAttachmentAction,
	zohoDeskDownloadTaskAttachmentAction,
	zohoDeskListProductsAction,
	zohoDeskGetProductAction,
	zohoDeskSearchProductsAction,
	zohoDeskFindDuplicateProductsAction,
	zohoDeskCreateProductAction,
	zohoDeskUpdateProductAction,
	zohoDeskDeleteProductsAction,
	zohoDeskListProductAccountsAction,
	zohoDeskListProductContactsAction,
	zohoDeskListProductTicketsAction,
	zohoDeskAssociateProductAccountsAction,
	zohoDeskAssociateProductContactsAction,
	zohoDeskListProductAttachmentsAction,
	zohoDeskUploadProductAttachmentAction,
	zohoDeskDeleteProductAttachmentAction,
	zohoDeskListArticlesAction,
	zohoDeskSearchArticlesAction,
	zohoDeskGetArticleAction,
	zohoDeskListOrganizationsAction,
	zohoDeskGetOrganizationAction,
	zohoDeskListAgentsAction,
	zohoDeskGetAgentAction,
	zohoDeskFindAgentByEmailAction,
	zohoDeskCountAgentsAction,
	zohoDeskCountAgentsByTypeAction,
	zohoDeskGetCurrentAgentAction,
	zohoDeskListDepartmentsAction,
	zohoDeskGetDepartmentAction,
	zohoDeskCountDepartmentsAction,
	zohoDeskListDepartmentAgentsAction,
	zohoDeskListDepartmentTeamsAction,
	zohoDeskGetTeamAction,
	zohoDeskListTeamMembersAction,
	zohoDeskListRolesAction,
	zohoDeskGetRoleAction,
	zohoDeskGetRolesByIdsAction,
	zohoDeskCountRolesAction,
	zohoDeskListViewsAction,
	zohoDeskListFieldsAction,
	zohoDeskSearchAction,
	zohoDeskListTicketTimeEntriesAction,
	zohoDeskAddTicketTimeEntryAction,
	zohoDeskGetTicketTimeEntryAction,
	zohoDeskUpdateTicketTimeEntryAction,
	zohoDeskDeleteTicketTimeEntryAction,
	zohoDeskListTicketTimeEntriesByBillingTypeAction,
	zohoDeskGetTicketTimeSummaryAction,
	zohoDeskGetTicketTimerAction,
	zohoDeskControlTicketTimerAction,
	zohoDeskListTicketActiveTimersAction,
	zohoDeskListTaskTimeEntriesAction,
	zohoDeskAddTaskTimeEntryAction,
	zohoDeskGetTaskTimeEntryAction,
	zohoDeskUpdateTaskTimeEntryAction,
	zohoDeskGetTaskTimeSummaryAction,
	zohoDeskGetTaskTimerAction,
	zohoDeskControlTaskTimerAction,
	zohoDeskListTaskActiveTimersAction,
	zohoDeskListContactTimeEntriesAction,
	zohoDeskGetContactTimeSummaryAction,
	zohoDeskListAccountTimeEntriesAction,
	zohoDeskGetAccountTimeSummaryAction,
	zohoDeskListAgentTimeEntriesAction,
	zohoDeskGetAgentTimeEntryAction,
	zohoDeskGetAgentTimeSummaryAction,
	zohoDeskListCallsAction,
	zohoDeskSearchCallsAction,
	zohoDeskGetCallAction,
	zohoDeskCreateCallAction,
	zohoDeskUpdateCallAction,
	zohoDeskDeleteCallsAction,
	zohoDeskUpdateManyCallsAction,
	zohoDeskUploadCallAttachmentAction,
	zohoDeskDeleteCallAttachmentAction,
	zohoDeskListCallCommentsAction,
	zohoDeskGetCallCommentAction,
	zohoDeskCreateCallCommentAction,
	zohoDeskUpdateCallCommentAction,
	zohoDeskDeleteCallCommentAction,
	zohoDeskListEventsAction,
	zohoDeskSearchEventsAction,
	zohoDeskGetEventAction,
	zohoDeskCreateEventAction,
	zohoDeskUpdateEventAction,
	zohoDeskDeleteEventsAction,
	zohoDeskUpdateManyEventsAction,
	zohoDeskListEventAttachmentsAction,
	zohoDeskUploadEventAttachmentAction,
	zohoDeskDeleteEventAttachmentAction,
	zohoDeskDownloadEventAttachmentAction,
	zohoDeskListEventCommentsAction,
	zohoDeskGetEventCommentAction,
	zohoDeskCreateEventCommentAction,
	zohoDeskUpdateEventCommentAction,
	zohoDeskSearchActivitiesAction,
	zohoDeskListSupportPlansAction,
	zohoDeskListContractsAction,
	zohoDeskCountContractsAction,
	zohoDeskGetContractAction,
	zohoDeskCreateContractAction,
	zohoDeskUpdateContractAction,
	zohoDeskUpdateManyContractsAction,
	zohoDeskListContractCommentsAction,
	zohoDeskGetContractCommentAction,
	zohoDeskCreateContractCommentAction,
	zohoDeskUpdateContractCommentAction,
	zohoDeskDeleteContractCommentAction,
	zohoDeskDownloadContractCommentAttachmentAction,
	zohoDeskListHelpCentersAction,
	zohoDeskListBadgesAction,
	zohoDeskListHelpCenterGroupsAction,
	zohoDeskListLabelsAction,
	zohoDeskListUsersAction,
	zohoDeskGetUserAction,
	zohoDeskUpdateUserAction,
	zohoDeskListUserBadgesAction,
	zohoDeskAddUserBadgesAction,
	zohoDeskRemoveUserBadgesAction,
	zohoDeskListUserGroupsAction,
	zohoDeskAddUserGroupsAction,
	zohoDeskRemoveUserGroupsAction,
	zohoDeskListUserLabelsAction,
	zohoDeskAssignUserLabelsAction,
	zohoDeskRemoveUserLabelsAction,
];
