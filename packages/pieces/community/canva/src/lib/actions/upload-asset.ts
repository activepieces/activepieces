import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an asset (image, video, or document) to Canva',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Name for the asset',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder to upload the asset to',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to associate with the asset',
      required: false,
    }),
  },
  async run(context) {
    const { file, name, folderId, tags } = context.propsValue;
    
    try {
      const uploadResult = await canvaCommon.uploadFile(
        context.auth,
        file.data,
        file.filename,
        file.extension
      );

      const assetData = {
        name: name || file.filename,
        asset_id: uploadResult.asset.id,
        folder_id: folderId,
        tags: tags || [],
      };

      const result = await canvaCommon.makeRequest(
        context.auth,
        'POST',
        '/assets',
        assetData
      );

      return {
        success: true,
        asset: result.asset,
        message: `Asset "${assetData.name}" uploaded successfully`,
      };
    } catch (error:any) {
      throw new Error(`Failed to upload asset: ${error.message}`);
    }
  },
});