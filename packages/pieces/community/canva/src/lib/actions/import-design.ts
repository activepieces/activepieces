import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCallRaw, pollImportJob } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const importDesignAction = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import a design file (PDF, image, etc.) into Canva',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to import (PDF, PPTX, AI, image, etc.)',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the imported design',
      required: false,
    }),
    mimeType: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'The MIME type of the file being imported',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'PDF', value: 'application/pdf' },
          { label: 'PowerPoint (PPTX)', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'Adobe Illustrator (AI)', value: 'application/illustrator' },
          { label: 'JPEG', value: 'image/jpeg' },
          { label: 'PNG', value: 'image/png' },
          { label: 'SVG', value: 'image/svg+xml' },
        ],
      },
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait for the import to complete before returning',
      required: false,
      defaultValue: true,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'Maximum time to wait for import completion',
      required: false,
      defaultValue: 60,
    }),
  },
  async run(context) {
    const { file, title, mimeType, waitForCompletion, maxWaitTime } =
      context.propsValue;

    const fileBuffer = Buffer.from(file.base64, 'base64');

    // Build Import-Metadata header
    const importMetadata: Record<string, string> = {
      mime_type: mimeType as string,
    };

    if (title) {
      importMetadata.title_base64 = Buffer.from(title).toString('base64');
    }

    // Canva import uses application/octet-stream with metadata in header
    const createResponse = await canvaApiCallRaw({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/imports',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': JSON.stringify(importMetadata),
        'Content-Length': String(fileBuffer.length),
      },
      body: fileBuffer,
    });

    const jobId = createResponse.job?.id;

    if (!jobId) {
      throw new Error('Failed to create import job');
    }

    if (waitForCompletion) {
      const maxAttempts = Math.ceil((maxWaitTime || 60) / 2);
      const result = await pollImportJob(
        context.auth,
        jobId,
        maxAttempts,
        2000
      );

      return {
        job_id: jobId,
        status: result.job.status,
        design: result.design,
        success: true,
      };
    }

    return {
      job_id: jobId,
      status: createResponse.job.status,
      message: 'Import job created. Use the job ID to check status later.',
    };
  },
});
