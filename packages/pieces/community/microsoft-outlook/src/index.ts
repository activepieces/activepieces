import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getGraphBaseUrl } from './lib/common/microsoft-cloud';
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { addLabelToEmailAction } from './lib/actions/add-label-to-email';
import { createDraftEmailAction } from './lib/actions/create-draft-email';
import { downloadAttachmentAction } from './lib/actions/download-email-attachment';
import { findEmailAction } from './lib/actions/find-email';
import { forwardEmailAction } from './lib/actions/forward-email';
import { moveEmailToFolderAction } from './lib/actions/move-email-to-folder';
import { removeLabelFromEmailAction } from './lib/actions/remove-label-from-email';
import { replyEmailAction } from './lib/actions/reply-email';
import { sendDraftEmailAction } from './lib/actions/send-draft-email';
import { sendEmailAction } from './lib/actions/send-email';
import { microsoftOutlookAuth } from './lib/common/auth';
import { newAttachmentTrigger } from './lib/triggers/new-attachment';
import { newEmailInFolderTrigger } from './lib/triggers/new-email-in-folder';
import { newEmailTrigger } from './lib/triggers/new-email';
import { requestApprovalInMail } from './lib/actions/request-approval-send-email';
import { outlookAddMessageAttachmentAction } from './lib/actions/outlook-add-message-attachment';
import { outlookAddMessageCategoriesAction } from './lib/actions/outlook-add-message-categories';
import { outlookBatchMoveMessagesAction } from './lib/actions/outlook-batch-move-messages';
import { outlookBatchUpdateMessagesAction } from './lib/actions/outlook-batch-update-messages';
import { outlookCopyMailFolderAction } from './lib/actions/outlook-copy-mail-folder';
import { outlookCopyMessageAction } from './lib/actions/outlook-copy-message';
import { outlookCreateDraftAction } from './lib/actions/outlook-create-draft';
import { outlookCreateFocusedInboxOverrideAction } from './lib/actions/outlook-create-focused-inbox-override';
import { outlookCreateForwardDraftAction } from './lib/actions/outlook-create-forward-draft';
import { outlookCreateMailFolderAction } from './lib/actions/outlook-create-mail-folder';
import { outlookCreateReplyAllDraftAction } from './lib/actions/outlook-create-reply-all-draft';
import { outlookCreateReplyDraftAction } from './lib/actions/outlook-create-reply-draft';
import { outlookDeleteFocusedInboxOverrideAction } from './lib/actions/outlook-delete-focused-inbox-override';
import { outlookDeleteMailFolderAction } from './lib/actions/outlook-delete-mail-folder';
import { outlookDeleteMessageAction } from './lib/actions/outlook-delete-message';
import { outlookDeleteMessageAttachmentAction } from './lib/actions/outlook-delete-message-attachment';
import { outlookDownloadMessageAttachmentAction } from './lib/actions/outlook-download-message-attachment';
import { outlookForwardMessageAction } from './lib/actions/outlook-forward-message';
import { outlookGetMailFolderAction } from './lib/actions/outlook-get-mail-folder';
import { outlookGetMailTipsAction } from './lib/actions/outlook-get-mail-tips';
import { outlookGetMessageAction } from './lib/actions/outlook-get-message';
import { outlookGetMessageAttachmentAction } from './lib/actions/outlook-get-message-attachment';
import { outlookGetMessageMimeAction } from './lib/actions/outlook-get-message-mime';
import { outlookGetMyProfileAction } from './lib/actions/outlook-get-my-profile';
import { outlookGetSupportedTimeZonesAction } from './lib/actions/outlook-get-supported-time-zones';
import { outlookListChildMailFoldersAction } from './lib/actions/outlook-list-child-mail-folders';
import { outlookListFocusedInboxOverridesAction } from './lib/actions/outlook-list-focused-inbox-overrides';
import { outlookListMailFoldersAction } from './lib/actions/outlook-list-mail-folders';
import { outlookListMailFoldersDeltaAction } from './lib/actions/outlook-list-mail-folders-delta';
import { outlookListMessageAttachmentsAction } from './lib/actions/outlook-list-message-attachments';
import { outlookListMessagesAction } from './lib/actions/outlook-list-messages';
import { outlookListMessagesDeltaAction } from './lib/actions/outlook-list-messages-delta';
import { outlookMoveMailFolderAction } from './lib/actions/outlook-move-mail-folder';
import { outlookMoveMessageAction } from './lib/actions/outlook-move-message';
import { outlookPermanentlyDeleteMessageAction } from './lib/actions/outlook-permanently-delete-message';
import { outlookRemoveMessageCategoriesAction } from './lib/actions/outlook-remove-message-categories';
import { outlookReplyAllToMessageAction } from './lib/actions/outlook-reply-all-to-message';
import { outlookReplyToMessageAction } from './lib/actions/outlook-reply-to-message';
import { outlookSearchMessagesAction } from './lib/actions/outlook-search-messages';
import { outlookSendDraftAction } from './lib/actions/outlook-send-draft';
import { outlookSendEmailAction } from './lib/actions/outlook-send-email';
import { outlookSetMessageReadStatusAction } from './lib/actions/outlook-set-message-read-status';
import { outlookUpdateFocusedInboxOverrideAction } from './lib/actions/outlook-update-focused-inbox-override';
import { outlookUpdateMailFolderAction } from './lib/actions/outlook-update-mail-folder';
import { outlookUpdateMessageAction } from './lib/actions/outlook-update-message';

export const microsoftOutlook = createPiece({
	displayName: 'Microsoft Outlook',
	auth: microsoftOutlookAuth,
	minimumSupportedRelease: '0.87.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-outlook.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: ['lucaslimasouza', 'kishanprmr', 'sanket-a11y'],
	actions: [
		sendEmailAction,
		downloadAttachmentAction,
		replyEmailAction,
		createDraftEmailAction,
		addLabelToEmailAction,
		removeLabelFromEmailAction,
		requestApprovalInMail,
		moveEmailToFolderAction,
		sendDraftEmailAction,
		forwardEmailAction,
		findEmailAction,
		outlookListMessagesAction,
		outlookGetMessageAction,
		outlookSearchMessagesAction,
		outlookGetMessageMimeAction,
		outlookListMessagesDeltaAction,
		outlookSendEmailAction,
		outlookCreateDraftAction,
		outlookSendDraftAction,
		outlookReplyToMessageAction,
		outlookReplyAllToMessageAction,
		outlookForwardMessageAction,
		outlookCreateReplyDraftAction,
		outlookCreateReplyAllDraftAction,
		outlookCreateForwardDraftAction,
		outlookUpdateMessageAction,
		outlookSetMessageReadStatusAction,
		outlookMoveMessageAction,
		outlookCopyMessageAction,
		outlookDeleteMessageAction,
		outlookPermanentlyDeleteMessageAction,
		outlookBatchMoveMessagesAction,
		outlookBatchUpdateMessagesAction,
		outlookAddMessageCategoriesAction,
		outlookRemoveMessageCategoriesAction,
		outlookListMessageAttachmentsAction,
		outlookGetMessageAttachmentAction,
		outlookDownloadMessageAttachmentAction,
		outlookAddMessageAttachmentAction,
		outlookDeleteMessageAttachmentAction,
		outlookListMailFoldersAction,
		outlookListChildMailFoldersAction,
		outlookGetMailFolderAction,
		outlookCreateMailFolderAction,
		outlookUpdateMailFolderAction,
		outlookDeleteMailFolderAction,
		outlookCopyMailFolderAction,
		outlookMoveMailFolderAction,
		outlookListMailFoldersDeltaAction,
		outlookListFocusedInboxOverridesAction,
		outlookCreateFocusedInboxOverrideAction,
		outlookUpdateFocusedInboxOverrideAction,
		outlookDeleteFocusedInboxOverrideAction,
		outlookGetMailTipsAction,
		outlookGetMyProfileAction,
		outlookGetSupportedTimeZonesAction,
		createCustomApiCallAction({
			auth: microsoftOutlookAuth,
			baseUrl: (auth) => {
				const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
				return getGraphBaseUrl(cloud) + '/v1.0/';
			},
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [
		newEmailTrigger,
		newEmailInFolderTrigger,
		newAttachmentTrigger,
	],
});
