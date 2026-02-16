import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const importDesignAction = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import a file as a new Canva design (PDF, PPTX, DOCX, PSD, AI, etc.)',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to import as a Canva design',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Optional title for the imported design',
      required: false,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait for the import to complete before returning',
      required: false,
      defaultValue: true,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'Maximum time to wait for import completion (default: 60)',
      required: false,
      defaultValue: 60,
    }),
  },
  async run(context) {
    const { file, title, waitForCompletion, maxWaitTime } = context.propsValue;

    // Build Import-Metadata header
    const metadata: Record<string, string> = {};
    if (title) {
      metadata.title_base64 = Buffer.from(title).toString('base64');
    }
    if (file.extension) {
      // Map common extensions to MIME types
      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ppt: 'application/vnd.ms-powerpoint',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        psd: 'image/vnd.adobe.photoshop',
        ai: 'application/illustrator',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      const ext = file.extension.toLowerCase().replace('.', '');
      if (mimeMap[ext]) {
        metadata.mime_type = mimeMap[ext];
      }
    }

    const fileBuffer = Buffer.from(file.base64, 'base64');

    // POST /imports with octet-stream body + Import-Metadata header
    const createResponse = await httpClient.sendRequest<{
      job: { id: string; status: string };
    }>({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/imports',
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': JSON.stringify(metadata),
      },
      body: fileBuffer,
    });

    const jobId = createResponse.body.job.id;

    // Poll GET /imports/{jobId} if waiting
    if (waitForCompletion) {
      const maxAttempts = Math.ceil((maxWaitTime || 60) / 2);
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await canvaApiCall<{
          job: {
            id: string;
            status: string;
            result?: { designs: Array<{ id: string; url: string }> };
            error?: { message: string };
          };
        }>({
          auth: context.auth,
          method: HttpMethod.GET,
          path: `/imports/${jobId}`,
        });

        if (result.job.status === 'success') {
          return {
            job_id: jobId,
            status: 'success',
            designs: result.job.result?.designs,
          };
        }

        if (result.job.status === 'failed') {
          throw new Error(
            `Import failed: ${result.job.error?.message || 'Unknown error'}`
          );
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      throw new Error('Import timed out after maximum attempts');
    }

    return {
      job_id: jobId,
      status: createResponse.body.job.status,
      message: 'Import job created. Use the job ID to check status later.',
    };
  },
});
