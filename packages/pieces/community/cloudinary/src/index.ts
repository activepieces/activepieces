
import { createPiece } from "@activepieces/pieces-framework";
import { cloudinaryAuth } from "./lib/common/auth";
import { uploadResource } from "./lib/actions/upload-resource";
import { deleteResource } from "./lib/actions/delete-resource";
import { createUsageReport } from "./lib/actions/create-usage-report";
import { findResourceByPublicId } from "./lib/actions/find-resource-by-public-id";
import { transformResource } from "./lib/actions/transform-resource";
import { newResourceInFolder } from "./lib/triggers/new-resource";
import { newTagAddedToAsset } from "./lib/triggers/new-tag-added-to-asset";
import { cloudinaryAddRelatedAssetsByAssetId } from "./lib/actions/ai/add-related-assets-by-asset-id";
import { cloudinaryAddRelatedAssets } from "./lib/actions/ai/add-related-assets";
import { cloudinaryConcatenateVideos } from "./lib/actions/ai/concatenate-videos";
import { cloudinaryCreateFolder } from "./lib/actions/ai/create-folder";
import { cloudinaryCreateImageFromText } from "./lib/actions/ai/create-image-from-text";
import { cloudinaryCreateMetadataField } from "./lib/actions/ai/create-metadata-field";
import { cloudinaryCreateMultiResource } from "./lib/actions/ai/create-multi-resource";
import { cloudinaryCreateTransformation } from "./lib/actions/ai/create-transformation";
import { cloudinaryDeleteDerivedResources } from "./lib/actions/ai/delete-derived-resources";
import { cloudinaryDeleteFolder } from "./lib/actions/ai/delete-folder";
import { cloudinaryDeleteMetadataDatasourceEntries } from "./lib/actions/ai/delete-metadata-datasource-entries";
import { cloudinaryDeleteMetadataField } from "./lib/actions/ai/delete-metadata-field";
import { cloudinaryDeleteRelatedAssetsByAssetId } from "./lib/actions/ai/delete-related-assets-by-asset-id";
import { cloudinaryDeleteRelatedAssets } from "./lib/actions/ai/delete-related-assets";
import { cloudinaryDeleteResourcesByTag } from "./lib/actions/ai/delete-resources-by-tag";
import { cloudinaryDeleteResources } from "./lib/actions/ai/delete-resources";
import { cloudinaryDeleteTransformation } from "./lib/actions/ai/delete-transformation";
import { cloudinaryDestroyAssetById } from "./lib/actions/ai/destroy-asset-by-id";
import { cloudinaryExplicitResource } from "./lib/actions/ai/explicit-resource";
import { cloudinaryExplodeResource } from "./lib/actions/ai/explode-resource";
import { cloudinaryGenerateArchive } from "./lib/actions/ai/generate-archive";
import { cloudinaryGenerateDownloadUrl } from "./lib/actions/ai/generate-download-url";
import { cloudinaryGetConfig } from "./lib/actions/ai/get-config";
import { cloudinaryGetFolder } from "./lib/actions/ai/get-folder";
import { cloudinaryGetMetadataField } from "./lib/actions/ai/get-metadata-field";
import { cloudinaryGetResourceByAssetId } from "./lib/actions/ai/get-resource-by-asset-id";
import { cloudinaryGetResource } from "./lib/actions/ai/get-resource";
import { cloudinaryGetTransformation } from "./lib/actions/ai/get-transformation";
import { cloudinaryGetUploadPreset } from "./lib/actions/ai/get-upload-preset";
import { cloudinaryGetUsage } from "./lib/actions/ai/get-usage";
import { cloudinaryGetVideoViews } from "./lib/actions/ai/get-video-views";
import { cloudinaryListMetadataFields } from "./lib/actions/ai/list-metadata-fields";
import { cloudinaryListResourceTypes } from "./lib/actions/ai/list-resource-types";
import { cloudinaryListResourcesByAssetFolder } from "./lib/actions/ai/list-resources-by-asset-folder";
import { cloudinaryListResourcesByAssetIds } from "./lib/actions/ai/list-resources-by-asset-ids";
import { cloudinaryListResourcesByContext } from "./lib/actions/ai/list-resources-by-context";
import { cloudinaryListResourcesByExternalIds } from "./lib/actions/ai/list-resources-by-external-ids";
import { cloudinaryListResourcesByTag } from "./lib/actions/ai/list-resources-by-tag";
import { cloudinaryListResourcesInModeration } from "./lib/actions/ai/list-resources-in-moderation";
import { cloudinaryListResources } from "./lib/actions/ai/list-resources";
import { cloudinaryListRootFolders } from "./lib/actions/ai/list-root-folders";
import { cloudinaryListSubfolders } from "./lib/actions/ai/list-subfolders";
import { cloudinaryListTags } from "./lib/actions/ai/list-tags";
import { cloudinaryListTransformations } from "./lib/actions/ai/list-transformations";
import { cloudinaryListUploadPresets } from "./lib/actions/ai/list-upload-presets";
import { cloudinaryOrderMetadataDatasource } from "./lib/actions/ai/order-metadata-datasource";
import { cloudinaryRenameFolder } from "./lib/actions/ai/rename-folder";
import { cloudinaryRenameResource } from "./lib/actions/ai/rename-resource";
import { cloudinaryReorderMetadataField } from "./lib/actions/ai/reorder-metadata-field";
import { cloudinaryReorderMetadataFields } from "./lib/actions/ai/reorder-metadata-fields";
import { cloudinaryRestoreMetadataDatasourceEntries } from "./lib/actions/ai/restore-metadata-datasource-entries";
import { cloudinarySearchAllMetadataDatasources } from "./lib/actions/ai/search-all-metadata-datasources";
import { cloudinarySearchAssets } from "./lib/actions/ai/search-assets";
import { cloudinarySearchFolders } from "./lib/actions/ai/search-folders";
import { cloudinarySearchMetadataFieldDatasource } from "./lib/actions/ai/search-metadata-field-datasource";
import { cloudinaryUpdateMetadataFieldDatasource } from "./lib/actions/ai/update-metadata-field-datasource";
import { cloudinaryUpdateMetadataField } from "./lib/actions/ai/update-metadata-field";
import { cloudinaryUpdateResourceByAssetId } from "./lib/actions/ai/update-resource-by-asset-id";
import { cloudinaryUpdateResourceContext } from "./lib/actions/ai/update-resource-context";
import { cloudinaryUpdateResourceMetadata } from "./lib/actions/ai/update-resource-metadata";
import { cloudinaryUpdateResourceTags } from "./lib/actions/ai/update-resource-tags";
import { cloudinaryUpdateResource } from "./lib/actions/ai/update-resource";
import { cloudinaryUpdateTransformation } from "./lib/actions/ai/update-transformation";
import { cloudinaryUploadAsset } from "./lib/actions/ai/upload-asset";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { BASE_URL } from "./lib/common/client";
import { PieceCategory } from '@activepieces/pieces-framework';

export const cloudinary = createPiece({
  displayName: "Cloudinary",
  auth: cloudinaryAuth,
  description: "Cloudinary is a cloud-based image and video management platform that allows you to upload, store, manage, and deliver your media assets. It provides a range of features for image and video optimization, transformation, and delivery.",
  categories: [PieceCategory.CONTENT_AND_FILES],
  minimumSupportedRelease: '0.88.2',
  logoUrl: "https://cdn.activepieces.com/pieces/cloudinary.png",
  authors: ['Sanket6652','onyedikachi-david'],
  actions: [
    uploadResource,
    deleteResource,
    createUsageReport,
    findResourceByPublicId,
    transformResource,
    cloudinaryAddRelatedAssetsByAssetId,
    cloudinaryAddRelatedAssets,
    cloudinaryConcatenateVideos,
    cloudinaryCreateFolder,
    cloudinaryCreateImageFromText,
    cloudinaryCreateMetadataField,
    cloudinaryCreateMultiResource,
    cloudinaryCreateTransformation,
    cloudinaryDeleteDerivedResources,
    cloudinaryDeleteFolder,
    cloudinaryDeleteMetadataDatasourceEntries,
    cloudinaryDeleteMetadataField,
    cloudinaryDeleteRelatedAssetsByAssetId,
    cloudinaryDeleteRelatedAssets,
    cloudinaryDeleteResourcesByTag,
    cloudinaryDeleteResources,
    cloudinaryDeleteTransformation,
    cloudinaryDestroyAssetById,
    cloudinaryExplicitResource,
    cloudinaryExplodeResource,
    cloudinaryGenerateArchive,
    cloudinaryGenerateDownloadUrl,
    cloudinaryGetConfig,
    cloudinaryGetFolder,
    cloudinaryGetMetadataField,
    cloudinaryGetResourceByAssetId,
    cloudinaryGetResource,
    cloudinaryGetTransformation,
    cloudinaryGetUploadPreset,
    cloudinaryGetUsage,
    cloudinaryGetVideoViews,
    cloudinaryListMetadataFields,
    cloudinaryListResourceTypes,
    cloudinaryListResourcesByAssetFolder,
    cloudinaryListResourcesByAssetIds,
    cloudinaryListResourcesByContext,
    cloudinaryListResourcesByExternalIds,
    cloudinaryListResourcesByTag,
    cloudinaryListResourcesInModeration,
    cloudinaryListResources,
    cloudinaryListRootFolders,
    cloudinaryListSubfolders,
    cloudinaryListTags,
    cloudinaryListTransformations,
    cloudinaryListUploadPresets,
    cloudinaryOrderMetadataDatasource,
    cloudinaryRenameFolder,
    cloudinaryRenameResource,
    cloudinaryReorderMetadataField,
    cloudinaryReorderMetadataFields,
    cloudinaryRestoreMetadataDatasourceEntries,
    cloudinarySearchAllMetadataDatasources,
    cloudinarySearchAssets,
    cloudinarySearchFolders,
    cloudinarySearchMetadataFieldDatasource,
    cloudinaryUpdateMetadataFieldDatasource,
    cloudinaryUpdateMetadataField,
    cloudinaryUpdateResourceByAssetId,
    cloudinaryUpdateResourceContext,
    cloudinaryUpdateResourceMetadata,
    cloudinaryUpdateResourceTags,
    cloudinaryUpdateResource,
    cloudinaryUpdateTransformation,
    cloudinaryUploadAsset,
    createCustomApiCallAction({
      auth: cloudinaryAuth,
      baseUrl: (auth) => (auth ? `${BASE_URL}/${auth.props.cloud_name.trim()}` : ''),
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.props.api_key.trim()}:${auth.props.api_secret.trim()}`).toString('base64')}`,
      }),
    }),
  ],
  triggers: [newResourceInFolder, newTagAddedToAsset],
});
