import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createUsageReport } from './lib/actions/create-usage-report'
import { deleteResource } from './lib/actions/delete-resource'
import { findResourceByPublicId } from './lib/actions/find-resource-by-public-id'
import { transformResource } from './lib/actions/transform-resource'
import { uploadResource } from './lib/actions/upload-resource'
import { cloudinaryAuth } from './lib/common/auth'
import { newResourceInFolder } from './lib/triggers/new-resource'
import { newTagAddedToAsset } from './lib/triggers/new-tag-added-to-asset'

export const cloudinary = createPiece({
    displayName: 'Cloudinary',
    auth: cloudinaryAuth,
    description:
        'Cloudinary is a cloud-based image and video management platform that allows you to upload, store, manage, and deliver your media assets. It provides a range of features for image and video optimization, transformation, and delivery.',
    categories: [PieceCategory.CONTENT_AND_FILES],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/cloudinary.png',
    authors: ['Sanket6652', 'onyedikachi-david'],
    actions: [uploadResource, deleteResource, createUsageReport, findResourceByPublicId, transformResource],
    triggers: [newResourceInFolder, newTagAddedToAsset],
})
