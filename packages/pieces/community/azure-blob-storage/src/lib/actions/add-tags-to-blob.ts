import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient, Tags } from '@azure/storage-blob';
import { containerProp } from '../common';

export const addTagsToBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'addTagsToBlob',
  displayName: 'Add Tags to Blob',
  description: 'Adds Tags to the Blob at the specified location',
  props: {
    container: containerProp,
    blobName: Property.ShortText({
      displayName: 'Blob Name',
      description: 'The name of the blob to add tags to',
      required: true,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'The tags to add to the blob',
      required: false,
      defaultValue: {},
    }),
    keepExistingTags: Property.Checkbox({
      displayName: 'Keep Existing Tags',
      description: 'Whether to keep existing tags on the blob',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { container, blobName, tags, keepExistingTags } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    let newtags = tags as Tags;

    if (keepExistingTags) {
      const previousTagResponse = await blobClient.getTags();
      newtags = { ...previousTagResponse.tags, ...newtags };
    };

    return await blobClient.setTags(newtags);
  },
});
