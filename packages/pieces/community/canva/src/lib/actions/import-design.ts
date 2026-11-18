import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  canvaAuth,
  canvaCommon,
  canvaProps,
  DesignImportJob,
  MAX_DESIGN_TITLE_LENGTH,
  SUPPORTED_IMPORT_FORMATS,
} from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  classification: 'WRITE',
  displayName: 'Import Design',
  description: 'Import a file (PDF, PPTX, DOCX, PSD, AI and more) into Canva as a new design and wait for the result.',
  audience: 'human',
  aiMetadata: {
    description: 'Imports a file as a new Canva design. Human step; agents use canva_import_design_from_url. Not idempotent: each run creates new designs.',
    idempotent: false,
  },
  outputSchema: canvaOutputSchemas.importDesign,
  props: {
    file: Property.File({
      displayName: 'Design File',
      description: `Supported: ${SUPPORTED_IMPORT_FORMATS.map((f) => f.ext.toUpperCase()).join(', ')}.`,
      required: true,
    }),
    designTitle: Property.ShortText({
      displayName: 'Design Title',
      description: `Title for the imported design (max ${MAX_DESIGN_TITLE_LENGTH} characters).`,
      required: true,
    }),
    autoDetectMimeType: Property.Checkbox({
      displayName: 'Auto-detect File Type',
      description: 'Let Canva detect the file type. Turn off to send the type based on the file extension.',
      required: false,
      defaultValue: true,
    }),
    ...canvaProps.waitProps(),
  },
  async run(context) {
    const { file, designTitle, autoDetectMimeType, waitForCompletion, maxWaitSeconds } = context.propsValue;
    const title = designTitle.trim();
    if (!title) {
      throw new Error('Design title is required.');
    }
    if (title.length > MAX_DESIGN_TITLE_LENGTH) {
      throw new Error(`Design title must be ${MAX_DESIGN_TITLE_LENGTH} characters or fewer.`);
    }
    const extension = file.filename?.split('.').pop()?.toLowerCase();
    const format = SUPPORTED_IMPORT_FORMATS.find((f) => f.ext === extension);
    if (!format) {
      throw new Error(`Unsupported file format: ${extension ?? 'unknown'}. Supported: ${SUPPORTED_IMPORT_FORMATS.map((f) => f.ext).join(', ')}.`);
    }
    const buffer = Buffer.from(file.base64, 'base64');
    const metadata: Record<string, string> = { title_base64: canvaCommon.base64Utf8(title) };
    if (autoDetectMimeType === false) {
      metadata['mime_type'] = format.mime;
    }
    const token = context.auth.access_token;
    const started = await canvaClient.request<{ job: DesignImportJob }>({
      token,
      method: HttpMethod.POST,
      path: '/imports',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': JSON.stringify(metadata),
      },
      body: buffer,
      timeoutMs: 300_000,
    });
    const job = waitForCompletion === false
      ? started.job
      : await canvaCommon.settleJob<DesignImportJob>({
          token,
          kind: 'import',
          initial: started.job,
          timeoutSeconds: canvaCommon.clampWaitSeconds(maxWaitSeconds ?? undefined),
          failOnTimeout: true,
        });
    const designs = job.result?.designs ?? [];
    return {
      success: job.status !== 'failed',
      job,
      designs,
      file_info: {
        title,
        size_mb: Math.round((buffer.length / (1024 * 1024)) * 100) / 100,
        format: format.name,
        extension: format.ext.toUpperCase(),
        mime_type: autoDetectMimeType === false ? format.mime : 'auto-detected',
      },
      message: job.status === 'success'
        ? `Import finished: ${designs.length} design(s) created.`
        : `Import job ${job.id} is ${job.status}. Check it later with Get Job Status.`,
    };
  },
});
