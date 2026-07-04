import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { listContainers } from './lib/actions/list-containers';
import { listBlobs } from './lib/actions/list-blobs';
import { createBlob } from './lib/actions/create-blob';
import { readBlob } from './lib/actions/read-blob';
import { deleteBlob } from './lib/actions/delete-blob';
import { addTagsToBlob } from './lib/actions/add-tags-to-blob';
import { findBlobs } from './lib/actions/find-blobs';
import { createContainer } from './lib/actions/create-container';
import { deleteContainer } from './lib/actions/delete-container';
import { BlobServiceClient } from '@azure/storage-blob';
import { azureBlobStorageAuth } from './lib/auth';

export const azureBlobStorage = createPiece({
  displayName: 'Azure Blob Storage',
  auth: azureBlobStorageAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-blob-storage.png',
  authors: ['Daniel-Klippa'],
  actions: [
    // Container actions
    listContainers,
    createContainer,
    deleteContainer,

    // Blob actions
    listBlobs,
    createBlob,
    readBlob,
    deleteBlob,
    addTagsToBlob,
    findBlobs,
  ],
  triggers: [],
});
