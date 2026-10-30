import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AI_WAIT_SECONDS, AssetUploadJob, canvaAuth, canvaCommon } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaUploadAssetFromUrlAi = createAction({
  auth: canvaAuth,
  name: 'canva_upload_asset_from_url',
  displayName: 'Upload Asset From URL',
  description: 'Uploads an image or video from a public URL to the Canva library.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: canvaOutputSchemas.job,
  aiMetadata: {
    description:
      "Adds an image or video from a public URL to the user's Canva library (videos up to 100MB). Starts an upload job and waits up to about 25 seconds. If status is success, asset holds the new asset and its ID. If still in_progress, call canva_get_asset_upload_job with job_id. Fails when Canva reports the upload failed (file_too_big, fetch_failed, import_failed). Each call creates another asset. To turn a document into an editable design use canva_import_design_from_url instead.",
    idempotent: false,
  },
  props: {
    url: Property.ShortText({ displayName: 'URL', description: 'Public http(s) URL of the file (8-2048 characters).', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Asset name, 1-255 characters.', required: true }),
  },
  async run(context) {
    const url = context.propsValue.url.trim();
    const name = context.propsValue.name.trim();
    if (!/^https?:\/\//i.test(url) || url.length < 8 || url.length > 2048) {
      throw new Error('URL must be a public http(s) link of 8-2048 characters.');
    }
    if (!name || name.length > 255) {
      throw new Error('Name must be 1-255 characters.');
    }
    const token = context.auth.access_token;
    const started = await canvaClient.request<{ job: AssetUploadJob }>({
      token,
      method: HttpMethod.POST,
      path: '/url-asset-uploads',
      body: { name, url },
    });
    const job = await canvaCommon.settleJob<AssetUploadJob>({ token, kind: 'url_asset_upload', initial: started.job, timeoutSeconds: AI_WAIT_SECONDS, failOnTimeout: false, statusAction: 'the canva_get_asset_upload_job tool' });
    return canvaCommon.flattenJob({ kind: 'url_asset_upload', job });
  },
});
