import { raindropCreateBackupAction } from './backups/create-backup';
import { raindropDownloadBackupAction } from './backups/download-backup';
import { raindropListBackupsAction } from './backups/list-backups';
import { raindropCreateBookmarkAction } from './bookmarks/create-bookmark';
import { raindropCreateBookmarksAction } from './bookmarks/create-bookmarks';
import { raindropDeleteBookmarkAction } from './bookmarks/delete-bookmark';
import { raindropDeleteBookmarksAction } from './bookmarks/delete-bookmarks';
import { raindropExportBookmarksAction } from './bookmarks/export-bookmarks';
import { raindropGetBookmarkAction } from './bookmarks/get-bookmark';
import { raindropListBookmarksAction } from './bookmarks/list-bookmarks';
import { raindropUpdateBookmarkAction } from './bookmarks/update-bookmark';
import { raindropUpdateBookmarksAction } from './bookmarks/update-bookmarks';
import { raindropUploadBookmarkCoverAction } from './bookmarks/upload-bookmark-cover';
import { raindropUploadFileAction } from './bookmarks/upload-file';
import { raindropCreateCollectionAction } from './collections/create-collection';
import { raindropDeleteCollectionAction } from './collections/delete-collection';
import { raindropDeleteCollectionsAction } from './collections/delete-collections';
import { raindropDeleteEmptyCollectionsAction } from './collections/delete-empty-collections';
import { raindropEmptyTrashAction } from './collections/empty-trash';
import { raindropExpandCollectionsAction } from './collections/expand-collections';
import { raindropGetCollectionAction } from './collections/get-collection';
import { raindropGetCollectionCountsAction } from './collections/get-collection-counts';
import { raindropListChildCollectionsAction } from './collections/list-child-collections';
import { raindropListCollectionsAction } from './collections/list-collections';
import { raindropListFeaturedCoversAction } from './collections/list-featured-covers';
import { raindropMergeCollectionsAction } from './collections/merge-collections';
import { raindropSearchCoversAction } from './collections/search-covers';
import { raindropSortCollectionsAction } from './collections/sort-collections';
import { raindropUpdateCollectionAction } from './collections/update-collection';
import { raindropUploadCollectionCoverAction } from './collections/upload-collection-cover';
import { raindropAddHighlightAction } from './highlights/add-highlight';
import { raindropDeleteHighlightAction } from './highlights/delete-highlight';
import { raindropListHighlightsAction } from './highlights/list-highlights';
import { raindropUpdateHighlightAction } from './highlights/update-highlight';
import { raindropCheckUrlsExistAction } from './import/check-urls-exist';
import { raindropParseImportFileAction } from './import/parse-import-file';
import { raindropParseUrlAction } from './import/parse-url';
import { raindropAcceptInvitationAction } from './sharing/accept-invitation';
import { raindropListCollaboratorsAction } from './sharing/list-collaborators';
import { raindropRemoveCollaboratorAction } from './sharing/remove-collaborator';
import { raindropShareCollectionAction } from './sharing/share-collection';
import { raindropUnshareCollectionAction } from './sharing/unshare-collection';
import { raindropUpdateCollaboratorAction } from './sharing/update-collaborator';
import { raindropDeleteTagsAction } from './tags/delete-tags';
import { raindropGetFiltersAction } from './tags/get-filters';
import { raindropListTagsAction } from './tags/list-tags';
import { raindropMergeTagsAction } from './tags/merge-tags';
import { raindropRenameTagAction } from './tags/rename-tag';
import { raindropGetCurrentUserAction } from './user/get-current-user';
import { raindropGetUserByNameAction } from './user/get-user-by-name';
import { raindropUpdateUserAction } from './user/update-user';

export const raindropAiActions = [
  raindropCreateBackupAction,
  raindropDownloadBackupAction,
  raindropListBackupsAction,
  raindropCreateBookmarkAction,
  raindropCreateBookmarksAction,
  raindropDeleteBookmarkAction,
  raindropDeleteBookmarksAction,
  raindropExportBookmarksAction,
  raindropGetBookmarkAction,
  raindropListBookmarksAction,
  raindropUpdateBookmarkAction,
  raindropUpdateBookmarksAction,
  raindropUploadBookmarkCoverAction,
  raindropUploadFileAction,
  raindropCreateCollectionAction,
  raindropDeleteCollectionAction,
  raindropDeleteCollectionsAction,
  raindropDeleteEmptyCollectionsAction,
  raindropEmptyTrashAction,
  raindropExpandCollectionsAction,
  raindropGetCollectionCountsAction,
  raindropGetCollectionAction,
  raindropListChildCollectionsAction,
  raindropListCollectionsAction,
  raindropListFeaturedCoversAction,
  raindropMergeCollectionsAction,
  raindropSearchCoversAction,
  raindropSortCollectionsAction,
  raindropUpdateCollectionAction,
  raindropUploadCollectionCoverAction,
  raindropAddHighlightAction,
  raindropDeleteHighlightAction,
  raindropListHighlightsAction,
  raindropUpdateHighlightAction,
  raindropCheckUrlsExistAction,
  raindropParseImportFileAction,
  raindropParseUrlAction,
  raindropAcceptInvitationAction,
  raindropListCollaboratorsAction,
  raindropRemoveCollaboratorAction,
  raindropShareCollectionAction,
  raindropUnshareCollectionAction,
  raindropUpdateCollaboratorAction,
  raindropDeleteTagsAction,
  raindropGetFiltersAction,
  raindropListTagsAction,
  raindropMergeTagsAction,
  raindropRenameTagAction,
  raindropGetCurrentUserAction,
  raindropGetUserByNameAction,
  raindropUpdateUserAction,
];
