import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AI_WAIT_SECONDS, canvaAuth, canvaCommon, DesignImportJob } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaImportDesignFromUrlAi = createAction({
  auth: canvaAuth,
  name: 'canva_import_design_from_url',
  displayName: 'Import Design From URL',
  description: 'Imports a file from a public URL as a new Canva design.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: canvaOutputSchemas.job,
  aiMetadata: {
    description:
      'Turns a file at a public URL (PDF, PPTX, DOCX, XLSX, Keynote, Pages, Numbers, PSD, AI, OpenDocument) into a new editable Canva design. Starts an import job and waits up to about 25 seconds. If status is success, designs holds the new design(s). If still in_progress, call canva_get_import_job with job_id. Fails when Canva reports the import failed. Each call creates new designs.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({ displayName: 'URL', description: 'Public http(s) URL of the file (max 2048 characters).', required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'Title for the new design, 1-255 characters.', required: true }),
    mimeType: Property.ShortText({ displayName: 'MIME Type', description: 'Optional MIME type of the file. Canva detects it when empty.', required: false }),
  },
  async run(context) {
    const url = context.propsValue.url.trim();
    const title = context.propsValue.title.trim();
    const mimeType = context.propsValue.mimeType?.trim();
    if (!/^https?:\/\//i.test(url) || url.length > 2048) {
      throw new Error('URL must be a public http(s) link of at most 2048 characters.');
    }
    if (!title || title.length > 255) {
      throw new Error('Title must be 1-255 characters.');
    }
    const body: Record<string, string> = { title, url };
    if (mimeType) {
      body['mime_type'] = mimeType;
    }
    const token = context.auth.access_token;
    const started = await canvaClient.request<{ job: DesignImportJob }>({ token, method: HttpMethod.POST, path: '/url-imports', body });
    const job = await canvaCommon.settleJob<DesignImportJob>({ token, kind: 'url_import', initial: started.job, timeoutSeconds: AI_WAIT_SECONDS, failOnTimeout: false, statusAction: 'the canva_get_import_job tool' });
    return canvaCommon.flattenJob({ kind: 'url_import', job });
  },
});
