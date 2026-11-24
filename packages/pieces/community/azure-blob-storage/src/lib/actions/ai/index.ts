import { aiCopyBlob } from './copy-blob';
import { aiDeleteBlob } from './delete-blob';
import { aiFindBlobsByTags } from './find-blobs-by-tags';
import { aiGenerateSasUrl } from './generate-sas-url';
import { aiGetBlobProperties } from './get-blob-properties';
import { aiGetBlobTags } from './get-blob-tags';
import { aiListBlobs } from './list-blobs';
import { aiListContainers } from './list-containers';
import { aiReadBlob } from './read-blob';
import { aiSetAccessTier } from './set-access-tier';
import { aiSetBlobMetadata } from './set-blob-metadata';
import { aiSetBlobTags } from './set-blob-tags';
import { aiUploadBlob } from './upload-blob';

export const azureBlobAiActions = [
  aiListContainers,
  aiListBlobs,
  aiGetBlobProperties,
  aiReadBlob,
  aiUploadBlob,
  aiCopyBlob,
  aiDeleteBlob,
  aiGetBlobTags,
  aiSetBlobTags,
  aiFindBlobsByTags,
  aiSetBlobMetadata,
  aiSetAccessTier,
  aiGenerateSasUrl,
];
