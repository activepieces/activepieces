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

export const azureBlobStorageAuth = PieceAuth.CustomAuth({
  displayName: 'Azure Blob Storage Auth',
  description:
    'Authenticate with Azure Blob Storage using Account Name and Account Key',
  props: {
    connectionString: Property.ShortText({
      displayName: 'Connection String',
      description:
        "You can obtain it from 'Security + networking -> Access Keys' menu.",
      required: true,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        auth.connectionString
      );
      await blobServiceClient.getAccountInfo();

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid Connection String',
      };
    }
  },
});

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
