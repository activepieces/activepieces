import { getFileActivityStatsAction } from './analytics/get-file-activity-stats';
import { getFileAnalyticsAction } from './analytics/get-file-analytics';
import { getListItemActivityStatsAction } from './analytics/get-list-item-activity-stats';
import { getListItemAnalyticsAction } from './analytics/get-list-item-analytics';
import { getSiteActivityStatsAction } from './analytics/get-site-activity-stats';
import { getSiteAnalyticsAction } from './analytics/get-site-analytics';
import { listDriveActivitiesAction } from './analytics/list-drive-activities';
import { listFileActivitiesAction } from './analytics/list-file-activities';
import { listListActivitiesAction } from './analytics/list-list-activities';
import { listListItemActivitiesAction } from './analytics/list-list-item-activities';
import { createListColumnAction } from './columns/create-list-column';
import { createSiteColumnAction } from './columns/create-site-column';
import { deleteListColumnAction } from './columns/delete-list-column';
import { deleteSiteColumnAction } from './columns/delete-site-column';
import { getContentTypeColumnAction } from './columns/get-content-type-column';
import { getListColumnAction } from './columns/get-list-column';
import { getListContentTypeColumnAction } from './columns/get-list-content-type-column';
import { getSiteColumnAction } from './columns/get-site-column';
import { listListColumnsAction } from './columns/list-list-columns';
import { listSiteColumnsAction } from './columns/list-site-columns';
import { removeContentTypeColumnAction } from './columns/remove-content-type-column';
import { removeListContentTypeColumnAction } from './columns/remove-list-content-type-column';
import { updateContentTypeColumnAction } from './columns/update-content-type-column';
import { updateListColumnAction } from './columns/update-list-column';
import { updateListContentTypeColumnAction } from './columns/update-list-content-type-column';
import { updateSiteColumnAction } from './columns/update-site-column';
import { addContentTypeColumnAction } from './content-types/add-content-type-column';
import { addContentTypeToListAction } from './content-types/add-content-type-to-list';
import { addHubContentTypeToListAction } from './content-types/add-hub-content-type-to-list';
import { addHubContentTypeToSiteAction } from './content-types/add-hub-content-type-to-site';
import { addListContentTypeColumnAction } from './content-types/add-list-content-type-column';
import { associateContentTypeWithHubSitesAction } from './content-types/associate-content-type-with-hub-sites';
import { copyFileToDefaultContentLocationAction } from './content-types/copy-file-to-default-content-location';
import { createContentTypeAction } from './content-types/create-content-type';
import { deleteContentTypeAction } from './content-types/delete-content-type';
import { deleteListContentTypeAction } from './content-types/delete-list-content-type';
import { getContentTypeAction } from './content-types/get-content-type';
import { getListContentTypeAction } from './content-types/get-list-content-type';
import { listApplicableContentTypesAction } from './content-types/list-applicable-content-types';
import { listCompatibleHubContentTypesForListAction } from './content-types/list-compatible-hub-content-types-for-list';
import { listCompatibleHubContentTypesAction } from './content-types/list-compatible-hub-content-types';
import { listContentTypeColumnsAction } from './content-types/list-content-type-columns';
import { listContentTypesAction } from './content-types/list-content-types';
import { listListContentTypeColumnsAction } from './content-types/list-list-content-type-columns';
import { listListContentTypesAction } from './content-types/list-list-content-types';
import { updateContentTypeAction } from './content-types/update-content-type';
import { updateListContentTypeAction } from './content-types/update-list-content-type';
import { checkInFileAction } from './drives/check-in-file';
import { checkOutFileAction } from './drives/check-out-file';
import { deleteDriveItemAction } from './drives/delete-drive-item';
import { discardCheckoutAction } from './drives/discard-checkout';
import { downloadFileAction } from './drives/download-file';
import { downloadSharedFileAction } from './drives/download-shared-file';
import { followDriveItemAction } from './drives/follow-drive-item';
import { followSitesAction } from './drives/follow-sites';
import { getDriveChangesAction } from './drives/get-drive-changes';
import { getDriveItemAction } from './drives/get-drive-item';
import { getDriveAction } from './drives/get-drive';
import { getFilePreviewAction } from './drives/get-file-preview';
import { getListItemFileAction } from './drives/get-list-item-file';
import { getSiteDefaultDriveAction } from './drives/get-site-default-drive';
import { getSpecialFolderAction } from './drives/get-special-folder';
import { listFolderChildrenAction } from './drives/list-folder-children';
import { listFollowedFilesAction } from './drives/list-followed-files';
import { listFollowedSitesAction } from './drives/list-followed-sites';
import { listSiteDrivesAction } from './drives/list-site-drives';
import { listThumbnailsAction } from './drives/list-thumbnails';
import { permanentlyDeleteDriveItemAction } from './drives/permanently-delete-drive-item';
import { replaceFileContentAction } from './drives/replace-file-content';
import { unfollowDriveItemAction } from './drives/unfollow-drive-item';
import { unfollowSitesAction } from './drives/unfollow-sites';
import { updateDriveItemAction } from './drives/update-drive-item';
import { assignSensitivityLabelAction } from './labels/assign-sensitivity-label';
import { extractSensitivityLabelsAction } from './labels/extract-sensitivity-labels';
import { getRetentionLabelAction } from './labels/get-retention-label';
import { lockOrUnlockRecordAction } from './labels/lock-or-unlock-record';
import { removeRetentionLabelAction } from './labels/remove-retention-label';
import { setRetentionLabelAction } from './labels/set-retention-label';
import { getListItemChangesAction } from './list-items/get-list-item-changes';
import { getListItemAction } from './list-items/get-list-item';
import { listListItemsAction } from './list-items/list-list-items';
import { getListAction } from './lists/get-list';
import { listListOperationsAction } from './lists/list-list-operations';
import { listListsAction } from './lists/list-lists';
import { addSectionWebPartAction } from './pages/add-section-web-part';
import { addVerticalSectionWebPartAction } from './pages/add-vertical-section-web-part';
import { createHorizontalSectionAction } from './pages/create-horizontal-section';
import { createPageAction } from './pages/create-page';
import { createVerticalSectionAction } from './pages/create-vertical-section';
import { deleteHorizontalSectionAction } from './pages/delete-horizontal-section';
import { deletePageWebPartAction } from './pages/delete-page-web-part';
import { deletePageAction } from './pages/delete-page';
import { deleteSectionWebPartAction } from './pages/delete-section-web-part';
import { deleteVerticalSectionWebPartAction } from './pages/delete-vertical-section-web-part';
import { deleteVerticalSectionAction } from './pages/delete-vertical-section';
import { getHorizontalSectionAction } from './pages/get-horizontal-section';
import { getPageWebPartAction } from './pages/get-page-web-part';
import { getPageAction } from './pages/get-page';
import { getSectionColumnAction } from './pages/get-section-column';
import { getSectionWebPartAction } from './pages/get-section-web-part';
import { getVerticalSectionWebPartAction } from './pages/get-vertical-section-web-part';
import { getVerticalSectionAction } from './pages/get-vertical-section';
import { getWebPartPositionAction } from './pages/get-web-part-position';
import { getWebPartsByPositionAction } from './pages/get-web-parts-by-position';
import { listHorizontalSectionsAction } from './pages/list-horizontal-sections';
import { listPageWebPartsAction } from './pages/list-page-web-parts';
import { listPagesAction } from './pages/list-pages';
import { listSectionColumnsAction } from './pages/list-section-columns';
import { listSectionWebPartsAction } from './pages/list-section-web-parts';
import { listVerticalSectionWebPartsAction } from './pages/list-vertical-section-web-parts';
import { updateHorizontalSectionAction } from './pages/update-horizontal-section';
import { updatePageWebPartAction } from './pages/update-page-web-part';
import { updatePageAction } from './pages/update-page';
import { updateSectionWebPartAction } from './pages/update-section-web-part';
import { updateVerticalSectionWebPartAction } from './pages/update-vertical-section-web-part';
import { updateVerticalSectionAction } from './pages/update-vertical-section';
import { createSharingLinkAction } from './permissions/create-sharing-link';
import { deleteFilePermissionAction } from './permissions/delete-file-permission';
import { getFilePermissionAction } from './permissions/get-file-permission';
import { getSharedItemAction } from './permissions/get-shared-item';
import { grantSharingLinkAccessAction } from './permissions/grant-sharing-link-access';
import { inviteToFileAction } from './permissions/invite-to-file';
import { listFilePermissionsAction } from './permissions/list-file-permissions';
import { listListItemPermissionsAction } from './permissions/list-list-item-permissions';
import { listListPermissionsAction } from './permissions/list-list-permissions';
import { revokeFilePermissionGrantsAction } from './permissions/revoke-file-permission-grants';
import { updateFilePermissionAction } from './permissions/update-file-permission';
import { searchAction } from './search/search';
import { getListOperationAction } from './sites/get-list-operation';
import { getRootSiteAction } from './sites/get-root-site';
import { getSiteByPathAction } from './sites/get-site-by-path';
import { getSiteOperationAction } from './sites/get-site-operation';
import { listSiteOperationsAction } from './sites/list-site-operations';
import { listSubsitesAction } from './sites/list-subsites';
import { createDocumentSetVersionAction } from './versions/create-document-set-version';
import { deleteDocumentSetVersionAction } from './versions/delete-document-set-version';
import { downloadFileVersionAction } from './versions/download-file-version';
import { getDocumentSetVersionAction } from './versions/get-document-set-version';
import { getFileVersionAction } from './versions/get-file-version';
import { getListItemVersionAction } from './versions/get-list-item-version';
import { listDocumentSetVersionsAction } from './versions/list-document-set-versions';
import { listFileVersionsAction } from './versions/list-file-versions';
import { listListItemVersionsAction } from './versions/list-list-item-versions';
import { restoreDocumentSetVersionAction } from './versions/restore-document-set-version';
import { restoreFileVersionAction } from './versions/restore-file-version';
import { restoreListItemVersionAction } from './versions/restore-list-item-version';

export const microsoftSharePointAiActions = [
  getFileActivityStatsAction,
  getFileAnalyticsAction,
  getListItemActivityStatsAction,
  getListItemAnalyticsAction,
  getSiteActivityStatsAction,
  getSiteAnalyticsAction,
  listDriveActivitiesAction,
  listFileActivitiesAction,
  listListActivitiesAction,
  listListItemActivitiesAction,
  createListColumnAction,
  createSiteColumnAction,
  deleteListColumnAction,
  deleteSiteColumnAction,
  getContentTypeColumnAction,
  getListColumnAction,
  getListContentTypeColumnAction,
  getSiteColumnAction,
  listListColumnsAction,
  listSiteColumnsAction,
  removeContentTypeColumnAction,
  removeListContentTypeColumnAction,
  updateContentTypeColumnAction,
  updateListColumnAction,
  updateListContentTypeColumnAction,
  updateSiteColumnAction,
  addContentTypeColumnAction,
  addContentTypeToListAction,
  addHubContentTypeToListAction,
  addHubContentTypeToSiteAction,
  addListContentTypeColumnAction,
  associateContentTypeWithHubSitesAction,
  copyFileToDefaultContentLocationAction,
  createContentTypeAction,
  deleteContentTypeAction,
  deleteListContentTypeAction,
  getContentTypeAction,
  getListContentTypeAction,
  listApplicableContentTypesAction,
  listCompatibleHubContentTypesForListAction,
  listCompatibleHubContentTypesAction,
  listContentTypeColumnsAction,
  listContentTypesAction,
  listListContentTypeColumnsAction,
  listListContentTypesAction,
  updateContentTypeAction,
  updateListContentTypeAction,
  checkInFileAction,
  checkOutFileAction,
  deleteDriveItemAction,
  discardCheckoutAction,
  downloadFileAction,
  downloadSharedFileAction,
  followDriveItemAction,
  followSitesAction,
  getDriveChangesAction,
  getDriveItemAction,
  getDriveAction,
  getFilePreviewAction,
  getListItemFileAction,
  getSiteDefaultDriveAction,
  getSpecialFolderAction,
  listFolderChildrenAction,
  listFollowedFilesAction,
  listFollowedSitesAction,
  listSiteDrivesAction,
  listThumbnailsAction,
  permanentlyDeleteDriveItemAction,
  replaceFileContentAction,
  unfollowDriveItemAction,
  unfollowSitesAction,
  updateDriveItemAction,
  assignSensitivityLabelAction,
  extractSensitivityLabelsAction,
  getRetentionLabelAction,
  lockOrUnlockRecordAction,
  removeRetentionLabelAction,
  setRetentionLabelAction,
  getListItemChangesAction,
  getListItemAction,
  listListItemsAction,
  getListAction,
  listListOperationsAction,
  listListsAction,
  addSectionWebPartAction,
  addVerticalSectionWebPartAction,
  createHorizontalSectionAction,
  createPageAction,
  createVerticalSectionAction,
  deleteHorizontalSectionAction,
  deletePageWebPartAction,
  deletePageAction,
  deleteSectionWebPartAction,
  deleteVerticalSectionWebPartAction,
  deleteVerticalSectionAction,
  getHorizontalSectionAction,
  getPageWebPartAction,
  getPageAction,
  getSectionColumnAction,
  getSectionWebPartAction,
  getVerticalSectionWebPartAction,
  getVerticalSectionAction,
  getWebPartPositionAction,
  getWebPartsByPositionAction,
  listHorizontalSectionsAction,
  listPageWebPartsAction,
  listPagesAction,
  listSectionColumnsAction,
  listSectionWebPartsAction,
  listVerticalSectionWebPartsAction,
  updateHorizontalSectionAction,
  updatePageWebPartAction,
  updatePageAction,
  updateSectionWebPartAction,
  updateVerticalSectionWebPartAction,
  updateVerticalSectionAction,
  createSharingLinkAction,
  deleteFilePermissionAction,
  getFilePermissionAction,
  getSharedItemAction,
  grantSharingLinkAccessAction,
  inviteToFileAction,
  listFilePermissionsAction,
  listListItemPermissionsAction,
  listListPermissionsAction,
  revokeFilePermissionGrantsAction,
  updateFilePermissionAction,
  searchAction,
  getListOperationAction,
  getRootSiteAction,
  getSiteByPathAction,
  getSiteOperationAction,
  listSiteOperationsAction,
  listSubsitesAction,
  createDocumentSetVersionAction,
  deleteDocumentSetVersionAction,
  downloadFileVersionAction,
  getDocumentSetVersionAction,
  getFileVersionAction,
  getListItemVersionAction,
  listDocumentSetVersionsAction,
  listFileVersionsAction,
  listListItemVersionsAction,
  restoreDocumentSetVersionAction,
  restoreFileVersionAction,
  restoreListItemVersionAction,
];
