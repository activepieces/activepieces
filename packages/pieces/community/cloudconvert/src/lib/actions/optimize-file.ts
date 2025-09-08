import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudConvertAuth, cloudConvertCommonProps } from '../auth';
import { createJob, extractExportedFiles, pollJobUntilDone } from '../common/client';

export const optimizeFile = createAction({
  name: 'optimize_file',
  displayName: 'Optimize File',
  description: 'Optimize and compress a file (e.g., images, PDFs).',
  auth: cloudConvertAuth,
  props: {
    inputUrl: Property.ShortText({
      displayName: 'Input File URL',
      required: true,
    }),
    profile: Property.ShortText({
      displayName: 'Optimization Profile (optional)',
      description: 'e.g., web, max, high, medium, low (depends on file type)',
      required: false,
    }),
    quality: Property.Number({
      displayName: 'Quality (optional)',
      description: '0-100 (when applicable)',
      required: false,
    }),
    ...cloudConvertCommonProps,
  },
  async run(context) {
    const auth = context.auth as string;
    const endpointOverride = context.propsValue['endpointOverride'] as string | undefined;

    const inputUrl = context.propsValue['inputUrl'] as string;
    const profile = context.propsValue['profile'] as string | undefined;
    const quality = context.propsValue['quality'] as number | undefined;
    const wait = context.propsValue['waitForCompletion'] as boolean;

    const tasks = {
      'import-1': { operation: 'import/url', url: inputUrl },
      'optimize-1': {
        operation: 'optimize',
        input: 'import-1',
        ...(profile ? { profile } : {}),
        ...(quality ? { quality } : {}),
      },
      'export-1': {
        operation: 'export/url',
        input: 'optimize-1',
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