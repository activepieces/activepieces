import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { 
  canvaCommon, 
  AssetUploadResponse,
  AssetUploadMetadata,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  MAX_ASSET_NAME_LENGTH
} from '../common';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video asset to your Canva library. This creates an asynchronous job that you can monitor for completion.',
  props: {
    file: Property.File({
      displayName: 'Asset File',
      description: `📁 Supported formats:
      🖼️ Images (max 50MB): ${SUPPORTED_IMAGE_FORMATS.map(f => f.toUpperCase()).join(', ')}
      🎬 Videos (max 500MB): ${SUPPORTED_VIDEO_FORMATS.map(f => f.toUpperCase()).join(', ')}`,
      required: true,
    }),
    assetName: Property.ShortText({
      displayName: 'Asset Name',
      description: '🏷️ Name for the asset (max 50 characters, supports emojis and special characters)',
      required: true,
    }),
  },
  async run(context) {
    const { file, assetName } = context.propsValue;
    
    if (!assetName || assetName.trim().length === 0) {
      throw new Error('Asset name is required');
    }
    
    if (assetName.length > MAX_ASSET_NAME_LENGTH) {
      throw new Error(`Asset name must be ${MAX_ASSET_NAME_LENGTH} characters or less`);
    }
    
    if (!file) {
      throw new Error('File is required');
    }
    
    const fileExtension = file.filename?.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      throw new Error('Unable to determine file type from filename');
    }
    
    const isImage = SUPPORTED_IMAGE_FORMATS.includes(fileExtension);
    const isVideo = SUPPORTED_VIDEO_FORMATS.includes(fileExtension);
    
    if (!isImage && !isVideo) {
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats - Images: ${SUPPORTED_IMAGE_FORMATS.join(', ')}. Videos: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
    }
    
    const fileBuffer = Buffer.from(file.base64, 'base64');
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    
    if (isImage && fileSizeMB > MAX_IMAGE_SIZE_MB) {
      throw new Error(`Image file size (${fileSizeMB.toFixed(2)}MB) exceeds maximum limit of ${MAX_IMAGE_SIZE_MB}MB`);
    }
    
    if (isVideo && fileSizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Video file size (${fileSizeMB.toFixed(2)}MB) exceeds maximum limit of ${MAX_VIDEO_SIZE_MB}MB`);
    }
    
    const nameBase64 = Buffer.from(assetName.trim()).toString('base64');
    
    const uploadMetadata: AssetUploadMetadata = {
      name_base64: nameBase64,
    };

    try {
      const response = await httpClient.sendRequest<AssetUploadResponse>({
        method: HttpMethod.POST,
        url: `${canvaCommon.baseUrl}/asset-uploads`,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Asset-Upload-Metadata': JSON.stringify(uploadMetadata),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: fileBuffer,
      });

      return {
        success: true,
        job: response.body.job,
        file_info: {
          name: assetName.trim(),
          size_mb: Math.round(fileSizeMB * 100) / 100,
          type: isImage ? 'image' : 'video',
          format: fileExtension.toUpperCase(),
        },
        message: `Asset upload job created successfully. Job ID: ${response.body.job.id}. Status: ${response.body.job.status}`,
        next_steps: response.body.job.status === 'in_progress' 
          ? 'Use the "Get Asset Upload Job" action to check the status and get the final asset details.'
          : undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request (30 requests per minute limit).');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Canva connection.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Make sure your integration has the required scope: asset:write');
      }
      
      if (error.response?.status === 413) {
        throw new Error('File too large. Check file size limits: Images max 50MB, Videos max 500MB.');
      }
      
      if (error.response?.data?.message) {
        throw new Error(`Canva API error: ${error.response.data.message}`);
      }
      
      throw new Error(`Failed to upload asset: ${error.message || 'Unknown error'}`);
    }
  },
}); 