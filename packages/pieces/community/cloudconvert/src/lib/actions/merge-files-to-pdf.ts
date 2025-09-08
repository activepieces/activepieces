import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudConvertAuth, cloudConvertCommonProps } from '../auth';
import { createJob, extractExportedFiles, pollJobUntilDone } from '../common/client';

export const mergeFilesToPdf = createAction({
  name: 'merge_files_to_pdf',
  displayName: 'Merge Files to PDF',
  description: 'Combine multiple documents/images into a single PDF.',
  auth: cloudConvertAuth,
  props: {
    inputUrls: Property.Array({
      displayName: 'Input File URLs',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Output Filename (optional)',
      required: false,
    }),
    ...cloudConvertCommonProps,
  },
  async run(context) {
    const auth = context.auth as string;
    const endpointOverride = context.propsValue['endpointOverride'] as string | undefined;

    const urls = (context.propsValue['inputUrls'] as string[]) ?? [];
    const filename = context.propsValue['filename'] as string | undefined;
    const wait = context.propsValue['waitForCompletion'] as boolean;

    const tasks: Record<string, unknown> = {};
    const importNames: string[] = [];

    urls.forEach((u, i) => {
      const name = `import-${i + 1}`;
      tasks[name] = { operation: 'import/url', url: u };
      importNames.push(name);
    });

    tasks['merge-1'] = {
      operation: 'merge',
      input: importNames,
      output_format: 'pdf',
      ...(filename ? { filename } : {}),
    };

    tasks['export-1'] = {
      operation: 'export/url',
      input: 'merge-1',
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