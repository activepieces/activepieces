import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cloudConvertAuth, cloudConvertCommonProps } from '../auth';
import { createJob, extractExportedFiles, pollJobUntilDone } from '../common/client';

export const convertFile = createAction({
  name: 'convert_file',
  displayName: 'Convert a File',
  description: 'Create a conversion job for a single file to the desired output format.',
  auth: cloudConvertAuth,
  props: {
    inputUrl: Property.ShortText({
      displayName: 'Input File URL',
      description: 'Publicly accessible URL of the source file.',
      required: true,
    }),
    outputFormat: Property.ShortText({
      displayName: 'Output Format',
      description: 'Target file format (e.g., pdf, png, docx).',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Output Filename (optional)',
      required: false,
    }),
    advancedOptions: Property.Json({
      displayName: 'Advanced Convert Options (optional)',
      description: 'Engine-specific options as JSON (for example: page_range, quality, dpi).',
      required: false,
    }),
    ...cloudConvertCommonProps,
  },
  async run(context) {
    const auth = context.auth as string;
    const endpointOverride = context.propsValue['endpointOverride'] as string | undefined;
    const inputUrl = context.propsValue['inputUrl'] as string;
    const outputFormat = context.propsValue['outputFormat'] as string;
    const filename = context.propsValue['filename'] as string | undefined;
    const advanced = (context.propsValue['advancedOptions'] as Record<string, unknown> | undefined) ?? {};
    const wait = context.propsValue['waitForCompletion'] as boolean;

    const tasks = {
      'import-1': {
        operation: 'import/url',
        url: inputUrl,
      },
      'convert-1': {
        operation: 'convert',
        input: 'import-1',
        output_format: outputFormat,
        ...(filename ? { filename } : {}),
        ...(advanced ?? {}),
      },
      'export-1': {
        operation: 'export/url',
        input: 'convert-1',
      },
    };

    const job = await createJob({ auth, tasks, endpointOverride });

    const finalJob = wait
      ? await pollJobUntilDone({ auth, jobId: job.id, endpointOverride })
      : job;

    return {
      jobId: finalJob.id,
      status: finalJob.status,
      files: extractExportedFiles(finalJob),
      job,
    };
  },
});