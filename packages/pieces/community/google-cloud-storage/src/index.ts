
import { createPiece } from "@activepieces/pieces-framework";
import { googleCloudStorageAuth } from "./lib/common/auth";
import { createBucket } from "./lib/actions/create-bucket";
import { deleteEmptyBucket } from "./lib/actions/delete-empty-bucket";
import { cloneObject } from "./lib/actions/clone-object";
import { deleteObject } from "./lib/actions/delete-object";
import { searchObjects } from "./lib/actions/search-objects";
import { searchBuckets } from "./lib/actions/search-buckets";
import { createObjectAcl } from "./lib/actions/create-object-acl";
import { deleteObjectAcl } from "./lib/actions/delete-object-acl";
import { createBucketAcl } from "./lib/actions/create-bucket-acl";
import { deleteBucketAcl } from "./lib/actions/delete-bucket-acl";
import { createBucketDefaultObjectAcl } from "./lib/actions/create-bucket-default-object-acl";
import { deleteBucketDefaultObjectAcl } from "./lib/actions/delete-bucket-default-object-acl";
import { newObjectCreated } from "./lib/triggers/new-object-created";
import { objectUpdated } from "./lib/triggers/object-updated";

export const googleCloudStorage = createPiece({
  displayName: "Google Cloud Storage",
  auth: googleCloudStorageAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/google-cloud-storage.png",
  authors: ["sparkybug"],
  actions: [
    createBucket,
    deleteEmptyBucket,
    cloneObject,
    deleteObject,
    searchObjects,
    searchBuckets,
    createObjectAcl,
    deleteObjectAcl,
    createBucketAcl,
    deleteBucketAcl,
    createBucketDefaultObjectAcl,
    deleteBucketDefaultObjectAcl,
  ],
  triggers: [
    newObjectCreated,
    objectUpdated,
  ],
});