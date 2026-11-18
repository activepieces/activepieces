import { getAuthorizedUserAction } from './meta/get-authorized-user';
import { getTokenInfoAction } from './meta/get-token-info';
import { deleteGoogleTagAction } from './sites/delete-google-tag';
import { deleteGoogleTagsAction } from './sites/delete-google-tags';
import { getSiteAction } from './sites/get-site';
import { listCustomDomainsAction } from './sites/list-custom-domains';
import { listGoogleTagsAction } from './sites/list-google-tags';
import { listSitesAiAction } from './sites/list-sites';
import { publishSiteAction } from './sites/publish-site';
import { upsertGoogleTagsAction } from './sites/upsert-google-tags';
import { createCollectionFieldAction } from './collections/create-collection-field';
import { createCollectionAction } from './collections/create-collection';
import { deleteCollectionFieldAction } from './collections/delete-collection-field';
import { deleteCollectionAction } from './collections/delete-collection';
import { getCollectionAction } from './collections/get-collection';
import { listCollectionsAiAction } from './collections/list-collections';
import { updateCollectionFieldAction } from './collections/update-collection-field';
import { updateCollectionAction } from './collections/update-collection';
import { createCollectionItemAiAction } from './items/create-collection-item';
import { createLiveCollectionItemAction } from './items/create-live-collection-item';
import { deleteCollectionItemAiAction } from './items/delete-collection-item';
import { deleteCollectionItemsAction } from './items/delete-collection-items';
import { getCollectionItemAiAction } from './items/get-collection-item';
import { getLiveCollectionItemAction } from './items/get-live-collection-item';
import { listCollectionItemsAction } from './items/list-collection-items';
import { listLiveCollectionItemsAction } from './items/list-live-collection-items';
import { publishCollectionItemsAction } from './items/publish-collection-items';
import { unpublishLiveCollectionItemAction } from './items/unpublish-live-collection-item';
import { unpublishLiveCollectionItemsAction } from './items/unpublish-live-collection-items';
import { updateCollectionItemAiAction } from './items/update-collection-item';
import { updateCollectionItemsAction } from './items/update-collection-items';
import { updateLiveCollectionItemAction } from './items/update-live-collection-item';
import { updateLiveCollectionItemsAction } from './items/update-live-collection-items';
import { createCommentReplyAction } from './comments/create-comment-reply';
import { getCommentThreadAction } from './comments/get-comment-thread';
import { listCommentRepliesAction } from './comments/list-comment-replies';
import { listCommentThreadsAction } from './comments/list-comment-threads';
import { resolveCommentThreadAction } from './comments/resolve-comment-thread';
import { getPageContentAction } from './pages/get-page-content';
import { getPageAction } from './pages/get-page';
import { listPagesAction } from './pages/list-pages';
import { updatePageAction } from './pages/update-page';
import { getComponentContentAction } from './components/get-component-content';
import { getComponentPropertiesAction } from './components/get-component-properties';
import { listComponentsAction } from './components/list-components';
import { deletePageCustomCodeAction } from './custom-code/delete-page-custom-code';
import { deleteSiteCustomCodeAction } from './custom-code/delete-site-custom-code';
import { getPageCustomCodeAction } from './custom-code/get-page-custom-code';
import { getSiteCustomCodeAction } from './custom-code/get-site-custom-code';
import { listCustomCodeBlocksAction } from './custom-code/list-custom-code-blocks';
import { listRegisteredScriptsAction } from './custom-code/list-registered-scripts';
import { registerHostedScriptAction } from './custom-code/register-hosted-script';
import { registerInlineScriptAction } from './custom-code/register-inline-script';
import { upsertPageCustomCodeAction } from './custom-code/upsert-page-custom-code';
import { upsertSiteCustomCodeAction } from './custom-code/upsert-site-custom-code';
import { deleteAssetAction } from './assets/delete-asset';
import { getAssetAction } from './assets/get-asset';
import { listAssetsAction } from './assets/list-assets';
import { updateAssetAction } from './assets/update-asset';
import { uploadAssetAction } from './assets/upload-asset';
import { createAssetFolderAction } from './asset-folders/create-asset-folder';
import { getAssetFolderAction } from './asset-folders/get-asset-folder';
import { listAssetFoldersAction } from './asset-folders/list-asset-folders';
import { createCustomFontAction } from './custom-fonts/create-custom-font';
import { createCustomFontsBatchAction } from './custom-fonts/create-custom-fonts-batch';
import { deleteCustomFontAction } from './custom-fonts/delete-custom-font';
import { deleteCustomFontsBatchAction } from './custom-fonts/delete-custom-fonts-batch';
import { getCustomFontAction } from './custom-fonts/get-custom-font';
import { listCustomFontsAction } from './custom-fonts/list-custom-fonts';
import { replaceCustomFontFileAction } from './custom-fonts/replace-custom-font-file';
import { updateCustomFontAction } from './custom-fonts/update-custom-font';
import { deleteFormSubmissionAction } from './forms/delete-form-submission';
import { getFormSubmissionAction } from './forms/get-form-submission';
import { getFormAction } from './forms/get-form';
import { listFormSubmissionsAction } from './forms/list-form-submissions';
import { listFormsAction } from './forms/list-forms';
import { listSiteFormSubmissionsAction } from './forms/list-site-form-submissions';
import { updateFormSubmissionAction } from './forms/update-form-submission';

export const webflowAiActions = [
	getAuthorizedUserAction,
	getTokenInfoAction,
	deleteGoogleTagAction,
	deleteGoogleTagsAction,
	getSiteAction,
	listCustomDomainsAction,
	listGoogleTagsAction,
	listSitesAiAction,
	publishSiteAction,
	upsertGoogleTagsAction,
	createCollectionFieldAction,
	createCollectionAction,
	deleteCollectionFieldAction,
	deleteCollectionAction,
	getCollectionAction,
	listCollectionsAiAction,
	updateCollectionFieldAction,
	updateCollectionAction,
	createCollectionItemAiAction,
	createLiveCollectionItemAction,
	deleteCollectionItemAiAction,
	deleteCollectionItemsAction,
	getCollectionItemAiAction,
	getLiveCollectionItemAction,
	listCollectionItemsAction,
	listLiveCollectionItemsAction,
	publishCollectionItemsAction,
	unpublishLiveCollectionItemAction,
	unpublishLiveCollectionItemsAction,
	updateCollectionItemAiAction,
	updateCollectionItemsAction,
	updateLiveCollectionItemAction,
	updateLiveCollectionItemsAction,
	createCommentReplyAction,
	getCommentThreadAction,
	listCommentRepliesAction,
	listCommentThreadsAction,
	resolveCommentThreadAction,
	getPageContentAction,
	getPageAction,
	listPagesAction,
	updatePageAction,
	getComponentContentAction,
	getComponentPropertiesAction,
	listComponentsAction,
	deletePageCustomCodeAction,
	deleteSiteCustomCodeAction,
	getPageCustomCodeAction,
	getSiteCustomCodeAction,
	listCustomCodeBlocksAction,
	listRegisteredScriptsAction,
	registerHostedScriptAction,
	registerInlineScriptAction,
	upsertPageCustomCodeAction,
	upsertSiteCustomCodeAction,
	deleteAssetAction,
	getAssetAction,
	listAssetsAction,
	updateAssetAction,
	uploadAssetAction,
	createAssetFolderAction,
	getAssetFolderAction,
	listAssetFoldersAction,
	createCustomFontAction,
	createCustomFontsBatchAction,
	deleteCustomFontAction,
	deleteCustomFontsBatchAction,
	getCustomFontAction,
	listCustomFontsAction,
	replaceCustomFontFileAction,
	updateCustomFontAction,
	deleteFormSubmissionAction,
	getFormSubmissionAction,
	getFormAction,
	listFormSubmissionsAction,
	listFormsAction,
	listSiteFormSubmissionsAction,
	updateFormSubmissionAction,
];
