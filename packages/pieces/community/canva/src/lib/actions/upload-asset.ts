import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  AssetUploadJob,
  canvaAuth,
  canvaCommon,
  canvaProps,
  MAX_ASSET_NAME_LENGTH,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
} from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  classification: 'WRITE',
  displayName: 'Upload Asset',
  description: 'Upload an image or video to your Canva library and wait until Canva has processed it.',
  audience: 'human',
  aiMetadata: {
    description: 'Uploads a file to the Canva library. Human step; agents use canva_upload_asset_from_url. Not idempotent: each run creates another asset.',
    idempotent: false,
  },
  outputSchema: canvaOutputSchemas.uploadAsset,
  props: {
    file: Property.File({
      displayName: 'Asset File',
      description: `Images (max ${MAX_IMAGE_SIZE_MB}MB): ${SUPPORTED_IMAGE_FORMATS.join(', ').toUpperCase()}. Videos (max ${MAX_VIDEO_SIZE_MB}MB): ${SUPPORTED_VIDEO_FORMATS.join(', ').toUpperCase()}.`,
      required: true,
    }),
    assetName: Property.ShortText({
      displayName: 'Asset Name',
      description: `Name for the asset (max ${MAX_ASSET_NAME_LENGTH} characters).`,
      required: true,
    }),
    ...canvaProps.waitProps(),
  },
  async run(context) {
    const { file, assetName, waitForCompletion, maxWaitSeconds } = context.propsValue;
    const name = assetName.trim();
    if (!name) {
      throw new Error('Asset name is required.');
    }
    if (name.length > MAX_ASSET_NAME_LENGTH) {
      throw new Error(`Asset name must be ${MAX_ASSET_NAME_LENGTH} characters or fewer.`);
    }
    const extension = file.filename?.split('.').pop()?.toLowerCase();
    if (!extension) {
      throw new Error('Could not tell the file type from the file name.');
    }
    const isImage = SUPPORTED_IMAGE_FORMATS.includes(extension);
    const isVideo = SUPPORTED_VIDEO_FORMATS.includes(extension);
    if (!isImage && !isVideo) {
      throw new Error(`Unsupported file format: ${extension}. Images: ${SUPPORTED_IMAGE_FORMATS.join(', ')}. Videos: ${SUPPORTED_VIDEO_FORMATS.join(', ')}.`);
    }
    const buffer = Buffer.from(file.base64, 'base64');
    const sizeMb = buffer.length / (1024 * 1024);
    const limitMb = isImage ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB;
    if (sizeMb > limitMb) {
      throw new Error(`File size (${sizeMb.toFixed(2)}MB) is over the ${limitMb}MB limit for ${isImage ? 'images' : 'videos'}.`);
    }
    const token = context.auth.access_token;
    const started = await canvaClient.request<{ job: AssetUploadJob }>({
      token,
      method: HttpMethod.POST,
      path: '/asset-uploads',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify({ name_base64: canvaCommon.base64Utf8(name) }),
      },
      body: buffer,
      timeoutMs: 300_000,
    });
    const job = waitForCompletion === false
      ? started.job
      : await canvaCommon.settleJob<AssetUploadJob>({
          token,
          kind: 'asset_upload',
          initial: started.job,
          timeoutSeconds: canvaCommon.clampWaitSeconds(maxWaitSeconds ?? undefined),
          failOnTimeout: true,
        });
    return {
      success: job.status !== 'failed',
      job,
      asset: job.asset ?? null,
      file_info: {
        name,
        size_mb: Math.round(sizeMb * 100) / 100,
        type: isImage ? 'image' : 'video',
        format: extension.toUpperCase(),
      },
      message: job.status === 'success'
        ? `Asset "${job.asset?.name ?? name}" uploaded. Asset ID: ${job.asset?.id ?? 'unknown'}`
        : `Upload job ${job.id} is ${job.status}. Check it later with Get Job Status.`,
    };
  },
});
