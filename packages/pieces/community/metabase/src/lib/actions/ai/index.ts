import { addGroupMemberAction } from './add-group-member';
import { checkDatabaseHealthAction } from './check-database-health';
import { convertQueryToNativeAction } from './convert-query-to-native';
import { copyCardAction } from './copy-card';
import { copyDashboardAction } from './copy-dashboard';
import { createActionAction } from './create-action';
import { createAlertAction } from './create-alert';
import { createBookmarkAction } from './create-bookmark';
import { createCardPublicLinkAction } from './create-card-public-link';
import { createCardAction } from './create-card';
import { createCollectionAction } from './create-collection';
import { createDashboardPublicLinkAction } from './create-dashboard-public-link';
import { createDashboardSubscriptionAction } from './create-dashboard-subscription';
import { createDashboardAction } from './create-dashboard';
import { createDocumentAction } from './create-document';
import { createGlossaryEntryAction } from './create-glossary-entry';
import { createGroupAction } from './create-group';
import { createSegmentAction } from './create-segment';
import { createSnippetAction } from './create-snippet';
import { createTimelineEventAction } from './create-timeline-event';
import { createTimelineAction } from './create-timeline';
import { createUserAction } from './create-user';
import { deactivateUserAction } from './deactivate-user';
import { deleteActionAction } from './delete-action';
import { deleteBookmarkAction } from './delete-bookmark';
import { deleteCardPublicLinkAction } from './delete-card-public-link';
import { deleteCardAction } from './delete-card';
import { deleteCollectionAction } from './delete-collection';
import { deleteDashboardPublicLinkAction } from './delete-dashboard-public-link';
import { deleteDashboardAction } from './delete-dashboard';
import { deleteDocumentAction } from './delete-document';
import { deleteGlossaryEntryAction } from './delete-glossary-entry';
import { deleteGroupAction } from './delete-group';
import { deleteSegmentAction } from './delete-segment';
import { deleteTimelineEventAction } from './delete-timeline-event';
import { deleteTimelineAction } from './delete-timeline';
import { discardDatabaseFieldValuesAction } from './discard-database-field-values';
import { discardFieldValuesAction } from './discard-field-values';
import { discardTableFieldValuesAction } from './discard-table-field-values';
import { executeActionAction } from './execute-action';
import { getActionAction } from './get-action';
import { getAlertAction } from './get-alert';
import { getCardQueryMetadataAction } from './get-card-query-metadata';
import { getCardAction } from './get-card';
import { getCollectionTreeAction } from './get-collection-tree';
import { getCollectionAction } from './get-collection';
import { getCurrentUserAction } from './get-current-user';
import { getDashboardSubscriptionAction } from './get-dashboard-subscription';
import { getDashboardAction } from './get-dashboard';
import { getDatabaseMetadataAction } from './get-database-metadata';
import { getDatabaseAction } from './get-database';
import { getDocumentAction } from './get-document';
import { getFieldSummaryAction } from './get-field-summary';
import { getFieldAction } from './get-field';
import { getGroupAction } from './get-group';
import { getSegmentAction } from './get-segment';
import { getSnippetAction } from './get-snippet';
import { getTableDataAction } from './get-table-data';
import { getTableMetadataAction } from './get-table-metadata';
import { getTableAction } from './get-table';
import { getTimelineEventAction } from './get-timeline-event';
import { getTimelineAction } from './get-timeline';
import { getUserAction } from './get-user';
import { listActionsAction } from './list-actions';
import { listAlertsAction } from './list-alerts';
import { listBookmarksAction } from './list-bookmarks';
import { listCardDashboardsAction } from './list-card-dashboards';
import { listCardParameterValuesAction } from './list-card-parameter-values';
import { listCardsAction } from './list-cards';
import { listCollectionItemsAction } from './list-collection-items';
import { listCollectionTimelinesAction } from './list-collection-timelines';
import { listCollectionsAction } from './list-collections';
import { listDashboardParameterValuesAction } from './list-dashboard-parameter-values';
import { listDashboardSubscriptionsAction } from './list-dashboard-subscriptions';
import { listDashboardsAction } from './list-dashboards';
import { listDatabaseFieldsAction } from './list-database-fields';
import { listDatabaseSchemasAction } from './list-database-schemas';
import { listDatabasesAction } from './list-databases';
import { listDocumentsAction } from './list-documents';
import { listFieldValuesAction } from './list-field-values';
import { listGlossaryEntriesAction } from './list-glossary-entries';
import { listGroupsAction } from './list-groups';
import { listPopularItemsAction } from './list-popular-items';
import { listRecentViewsAction } from './list-recent-views';
import { listRevisionsAction } from './list-revisions';
import { listSchemaTablesAction } from './list-schema-tables';
import { listSegmentsAction } from './list-segments';
import { listSnippetsAction } from './list-snippets';
import { listTableForeignKeysAction } from './list-table-foreign-keys';
import { listTablesAction } from './list-tables';
import { listTimelinesAction } from './list-timelines';
import { listUsersAction } from './list-users';
import { moveCardsAction } from './move-cards';
import { reactivateUserAction } from './reactivate-user';
import { removeGroupMemberAction } from './remove-group-member';
import { rescanDatabaseFieldValuesAction } from './rescan-database-field-values';
import { rescanFieldValuesAction } from './rescan-field-values';
import { rescanTableFieldValuesAction } from './rescan-table-field-values';
import { revertRevisionAction } from './revert-revision';
import { runCardQueryAction } from './run-card-query';
import { runDashboardCardQueryAction } from './run-dashboard-card-query';
import { runQueryAction } from './run-query';
import { searchCardParameterValuesAction } from './search-card-parameter-values';
import { searchDashboardParameterValuesAction } from './search-dashboard-parameter-values';
import { searchFieldValuesAction } from './search-field-values';
import { searchAction } from './search';
import { sendAlertAction } from './send-alert';
import { syncDatabaseSchemaAction } from './sync-database-schema';
import { syncTableSchemaAction } from './sync-table-schema';
import { updateActionAction } from './update-action';
import { updateAlertAction } from './update-alert';
import { updateCardAction } from './update-card';
import { updateCollectionAction } from './update-collection';
import { updateDashboardSubscriptionAction } from './update-dashboard-subscription';
import { updateDashboardAction } from './update-dashboard';
import { updateDatabaseAction } from './update-database';
import { updateDocumentAction } from './update-document';
import { updateFieldValuesAction } from './update-field-values';
import { updateFieldAction } from './update-field';
import { updateGlossaryEntryAction } from './update-glossary-entry';
import { updateSegmentAction } from './update-segment';
import { updateSnippetAction } from './update-snippet';
import { updateTableAction } from './update-table';
import { updateTimelineEventAction } from './update-timeline-event';
import { updateTimelineAction } from './update-timeline';
import { updateUserAction } from './update-user';

export const metabaseAiActions = [
  addGroupMemberAction,
  checkDatabaseHealthAction,
  convertQueryToNativeAction,
  copyCardAction,
  copyDashboardAction,
  createActionAction,
  createAlertAction,
  createBookmarkAction,
  createCardPublicLinkAction,
  createCardAction,
  createCollectionAction,
  createDashboardPublicLinkAction,
  createDashboardSubscriptionAction,
  createDashboardAction,
  createDocumentAction,
  createGlossaryEntryAction,
  createGroupAction,
  createSegmentAction,
  createSnippetAction,
  createTimelineEventAction,
  createTimelineAction,
  createUserAction,
  deactivateUserAction,
  deleteActionAction,
  deleteBookmarkAction,
  deleteCardPublicLinkAction,
  deleteCardAction,
  deleteCollectionAction,
  deleteDashboardPublicLinkAction,
  deleteDashboardAction,
  deleteDocumentAction,
  deleteGlossaryEntryAction,
  deleteGroupAction,
  deleteSegmentAction,
  deleteTimelineEventAction,
  deleteTimelineAction,
  discardDatabaseFieldValuesAction,
  discardFieldValuesAction,
  discardTableFieldValuesAction,
  executeActionAction,
  getActionAction,
  getAlertAction,
  getCardQueryMetadataAction,
  getCardAction,
  getCollectionTreeAction,
  getCollectionAction,
  getCurrentUserAction,
  getDashboardSubscriptionAction,
  getDashboardAction,
  getDatabaseMetadataAction,
  getDatabaseAction,
  getDocumentAction,
  getFieldSummaryAction,
  getFieldAction,
  getGroupAction,
  getSegmentAction,
  getSnippetAction,
  getTableDataAction,
  getTableMetadataAction,
  getTableAction,
  getTimelineEventAction,
  getTimelineAction,
  getUserAction,
  listActionsAction,
  listAlertsAction,
  listBookmarksAction,
  listCardDashboardsAction,
  listCardParameterValuesAction,
  listCardsAction,
  listCollectionItemsAction,
  listCollectionTimelinesAction,
  listCollectionsAction,
  listDashboardParameterValuesAction,
  listDashboardSubscriptionsAction,
  listDashboardsAction,
  listDatabaseFieldsAction,
  listDatabaseSchemasAction,
  listDatabasesAction,
  listDocumentsAction,
  listFieldValuesAction,
  listGlossaryEntriesAction,
  listGroupsAction,
  listPopularItemsAction,
  listRecentViewsAction,
  listRevisionsAction,
  listSchemaTablesAction,
  listSegmentsAction,
  listSnippetsAction,
  listTableForeignKeysAction,
  listTablesAction,
  listTimelinesAction,
  listUsersAction,
  moveCardsAction,
  reactivateUserAction,
  removeGroupMemberAction,
  rescanDatabaseFieldValuesAction,
  rescanFieldValuesAction,
  rescanTableFieldValuesAction,
  revertRevisionAction,
  runCardQueryAction,
  runDashboardCardQueryAction,
  runQueryAction,
  searchCardParameterValuesAction,
  searchDashboardParameterValuesAction,
  searchFieldValuesAction,
  searchAction,
  sendAlertAction,
  syncDatabaseSchemaAction,
  syncTableSchemaAction,
  updateActionAction,
  updateAlertAction,
  updateCardAction,
  updateCollectionAction,
  updateDashboardSubscriptionAction,
  updateDashboardAction,
  updateDatabaseAction,
  updateDocumentAction,
  updateFieldValuesAction,
  updateFieldAction,
  updateGlossaryEntryAction,
  updateSegmentAction,
  updateSnippetAction,
  updateTableAction,
  updateTimelineEventAction,
  updateTimelineAction,
  updateUserAction,
];
