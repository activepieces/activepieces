import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { googleCloudStorageAuth } from './lib/common/auth';
import { createCustomApiCallAction } from "@activepieces/pieces-common"; 

import { createBucket } from './lib/actions/create-bucket';
import { deleteEmptyBucket } from './lib/actions/delete-empty-bucket';
import { cloneObject } from './lib/actions/clone-object';
import { deleteObject } from './lib/actions/delete-object';
import { createObjectAcl } from './lib/actions/create-object-acl';
import { deleteObjectAcl } from './lib/actions/delete-object-acl';
import { createBucketAcl } from './lib/actions/create-bucket-acl';
import { deleteBucketAcl } from './lib/actions/delete-bucket-acl';
import { createBucketDefaultObjectAcl } from './lib/actions/create-bucket-default-object-acl';
import { deleteBucketDefaultObjectAcl } from './lib/actions/delete-bucket-default-object-acl';
import { searchObjects } from './lib/actions/search-objects';
import { searchBucket } from './lib/actions/search-bucket';


import { newObjectCreated } from './lib/triggers/new-object-created';
import { objectUpdated } from './lib/triggers/object-updated';

export const googleCloudStorage = createPiece({
  displayName: 'Google Cloud Storage',
  auth: googleCloudStorageAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-cloud-storage.png',
  description: 'A powerful and scalable object storage service to store, retrieve, and manage data objects in Google Cloud.',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['srimalleswari205'],
  actions: [
    createBucket,
    deleteEmptyBucket,
    searchBucket,
    cloneObject,
    deleteObject,
    searchObjects,
    createObjectAcl,
    deleteObjectAcl,
    createBucketAcl,
    deleteBucketAcl,
    createBucketDefaultObjectAcl,
    deleteBucketDefaultObjectAcl,
    createCustomApiCallAction({
        auth: googleCloudStorageAuth,
        baseUrl: () => 'https://storage.googleapis.com/storage/v1',
        authMapping: async (auth) => {
            const oauth2 = auth as OAuth2PropertyValue;
            return {
                Authorization: `Bearer ${oauth2.access_token}`
            };
        }
    })
  ],
  triggers: [
    newObjectCreated,
    objectUpdated,
  ],
});