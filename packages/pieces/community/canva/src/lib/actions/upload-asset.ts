import { createAction, Property } from '@activepieces/pieces-framework';

export const uploadAsset = createAction({
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Uploads an asset to a Canva folder using multipart upload',
  props: {
    fileUrl: Property.ShortText({ displayName: 'File URL', required: true }),
    folderId: Property.ShortText({ displayName: 'Folder ID', required: true })
  },
  async run(context) {
    // TODO: implement multipart upload using Activepieces httpClient and polling
    throw new Error('uploadAsset not implemented');
  }
});