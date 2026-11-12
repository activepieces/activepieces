import { addLabelsAction } from './add-labels';
import { addSpaceLabelsAction } from './add-space-labels';
import { archivePagesAction } from './archive-pages';
import { copyPageAction } from './copy-page';
import { createBlogPostAction } from './create-blog-post';
import { createBlogPostPropertyAction } from './create-blog-post-property';
import { createFolderAction } from './create-folder';
import { createFooterCommentAction } from './create-footer-comment';
import { createInlineCommentAction } from './create-inline-comment';
import { createPageAction } from './create-page';
import { createPagePropertyAction } from './create-page-property';
import { createSpaceAction } from './create-space';
import { createSpacePropertyAction } from './create-space-property';
import { createWhiteboardAction } from './create-whiteboard';
import { createWhiteboardPropertyAction } from './create-whiteboard-property';
import { deleteAttachmentAction } from './delete-attachment';
import { deleteBlogPostAction } from './delete-blog-post';
import { deleteBlogPostPropertyAction } from './delete-blog-post-property';
import { deleteFolderAction } from './delete-folder';
import { deleteFooterCommentAction } from './delete-footer-comment';
import { deleteInlineCommentAction } from './delete-inline-comment';
import { deletePageAction } from './delete-page';
import { deletePagePropertyAction } from './delete-page-property';
import { deleteSpaceAction } from './delete-space';
import { deleteSpacePropertyAction } from './delete-space-property';
import { deleteWhiteboardAction } from './delete-whiteboard';
import { deleteWhiteboardPropertyAction } from './delete-whiteboard-property';
import { getAttachmentAction } from './get-attachment';
import { getBlogPostAction } from './get-blog-post';
import { getBlogPostLikeCountAction } from './get-blog-post-like-count';
import { getBlogPostVersionAction } from './get-blog-post-version';
import { getContentRestrictionsAction } from './get-content-restrictions';
import { getCurrentUserAction } from './get-current-user';
import { getFolderAction } from './get-folder';
import { getFooterCommentAction } from './get-footer-comment';
import { getInlineCommentAction } from './get-inline-comment';
import { getLabelAction } from './get-label';
import { getLongTaskAction } from './get-long-task';
import { getPageAction } from './get-page';
import { getPageLikeCountAction } from './get-page-like-count';
import { getPageVersionAction } from './get-page-version';
import { getPageViewersAction } from './get-page-viewers';
import { getPageViewsAction } from './get-page-views';
import { getSpaceAction } from './get-space';
import { getTaskAction } from './get-task';
import { getTemplateAction } from './get-template';
import { getUserAction } from './get-user';
import { getWhiteboardAction } from './get-whiteboard';
import { listAttachmentCommentsAction } from './list-attachment-comments';
import { listAttachmentLabelsAction } from './list-attachment-labels';
import { listAuditRecordsAction } from './list-audit-records';
import { listBlogPostAttachmentsAction } from './list-blog-post-attachments';
import { listBlogPostFooterCommentsAction } from './list-blog-post-footer-comments';
import { listBlogPostInlineCommentsAction } from './list-blog-post-inline-comments';
import { listBlogPostLabelsAction } from './list-blog-post-labels';
import { listBlogPostOperationsAction } from './list-blog-post-operations';
import { listBlogPostPropertiesAction } from './list-blog-post-properties';
import { listBlogPostVersionsAction } from './list-blog-post-versions';
import { listBlogPostsAction } from './list-blog-posts';
import { listBlogPostsForLabelAction } from './list-blog-posts-for-label';
import { listChildPagesAction } from './list-child-pages';
import { listFolderChildrenAction } from './list-folder-children';
import { listFooterCommentRepliesAction } from './list-footer-comment-replies';
import { listGroupMembersAction } from './list-group-members';
import { listGroupsAction } from './list-groups';
import { listInlineCommentRepliesAction } from './list-inline-comment-replies';
import { listLabelsAction } from './list-labels';
import { listPageAncestorsAction } from './list-page-ancestors';
import { listPageAttachmentsAction } from './list-page-attachments';
import { listPageDescendantsAction } from './list-page-descendants';
import { listPageFooterCommentsAction } from './list-page-footer-comments';
import { listPageInlineCommentsAction } from './list-page-inline-comments';
import { listPageLabelsAction } from './list-page-labels';
import { listPageOperationsAction } from './list-page-operations';
import { listPagePropertiesAction } from './list-page-properties';
import { listPageVersionsAction } from './list-page-versions';
import { listPagesAction } from './list-pages';
import { listPagesForLabelAction } from './list-pages-for-label';
import { listSpaceContentLabelsAction } from './list-space-content-labels';
import { listSpaceLabelsAction } from './list-space-labels';
import { listSpacePropertiesAction } from './list-space-properties';
import { listSpacesAction } from './list-spaces';
import { listTasksAction } from './list-tasks';
import { listTemplatesAction } from './list-templates';
import { listWhiteboardPropertiesAction } from './list-whiteboard-properties';
import { movePageAction } from './move-page';
import { removeLabelAction } from './remove-label';
import { removeSpaceLabelAction } from './remove-space-label';
import { restorePageVersionAction } from './restore-page-version';
import { searchContentAction } from './search-content';
import { updateBlogPostAction } from './update-blog-post';
import { updateBlogPostPropertyAction } from './update-blog-post-property';
import { updateFooterCommentAction } from './update-footer-comment';
import { updateInlineCommentAction } from './update-inline-comment';
import { updatePageAction } from './update-page';
import { updatePagePropertyAction } from './update-page-property';
import { updatePageTitleAction } from './update-page-title';
import { updateSpaceAction } from './update-space';
import { updateSpacePropertyAction } from './update-space-property';
import { updateTaskAction } from './update-task';
import { updateWhiteboardPropertyAction } from './update-whiteboard-property';
import { uploadAttachmentAction } from './upload-attachment';

export const confluenceAiActions = [
	addLabelsAction,
	addSpaceLabelsAction,
	archivePagesAction,
	copyPageAction,
	createBlogPostPropertyAction,
	createBlogPostAction,
	createFolderAction,
	createFooterCommentAction,
	createInlineCommentAction,
	createPagePropertyAction,
	createPageAction,
	createSpacePropertyAction,
	createSpaceAction,
	createWhiteboardPropertyAction,
	createWhiteboardAction,
	deleteAttachmentAction,
	deleteBlogPostPropertyAction,
	deleteBlogPostAction,
	deleteFolderAction,
	deleteFooterCommentAction,
	deleteInlineCommentAction,
	deletePagePropertyAction,
	deletePageAction,
	deleteSpacePropertyAction,
	deleteSpaceAction,
	deleteWhiteboardPropertyAction,
	deleteWhiteboardAction,
	getAttachmentAction,
	getBlogPostLikeCountAction,
	getBlogPostVersionAction,
	getBlogPostAction,
	getContentRestrictionsAction,
	getCurrentUserAction,
	getFolderAction,
	getFooterCommentAction,
	getInlineCommentAction,
	getLabelAction,
	getLongTaskAction,
	getPageLikeCountAction,
	getPageVersionAction,
	getPageViewersAction,
	getPageViewsAction,
	getPageAction,
	getSpaceAction,
	getTaskAction,
	getTemplateAction,
	getUserAction,
	getWhiteboardAction,
	listAttachmentCommentsAction,
	listAttachmentLabelsAction,
	listAuditRecordsAction,
	listBlogPostAttachmentsAction,
	listBlogPostFooterCommentsAction,
	listBlogPostInlineCommentsAction,
	listBlogPostLabelsAction,
	listBlogPostOperationsAction,
	listBlogPostPropertiesAction,
	listBlogPostVersionsAction,
	listBlogPostsForLabelAction,
	listBlogPostsAction,
	listChildPagesAction,
	listFolderChildrenAction,
	listFooterCommentRepliesAction,
	listGroupMembersAction,
	listGroupsAction,
	listInlineCommentRepliesAction,
	listLabelsAction,
	listPageAncestorsAction,
	listPageAttachmentsAction,
	listPageDescendantsAction,
	listPageFooterCommentsAction,
	listPageInlineCommentsAction,
	listPageLabelsAction,
	listPageOperationsAction,
	listPagePropertiesAction,
	listPageVersionsAction,
	listPagesForLabelAction,
	listPagesAction,
	listSpaceContentLabelsAction,
	listSpaceLabelsAction,
	listSpacePropertiesAction,
	listSpacesAction,
	listTasksAction,
	listTemplatesAction,
	listWhiteboardPropertiesAction,
	movePageAction,
	removeLabelAction,
	removeSpaceLabelAction,
	restorePageVersionAction,
	searchContentAction,
	updateBlogPostPropertyAction,
	updateBlogPostAction,
	updateFooterCommentAction,
	updateInlineCommentAction,
	updatePagePropertyAction,
	updatePageTitleAction,
	updatePageAction,
	updateSpacePropertyAction,
	updateSpaceAction,
	updateTaskAction,
	updateWhiteboardPropertyAction,
	uploadAttachmentAction,
];
