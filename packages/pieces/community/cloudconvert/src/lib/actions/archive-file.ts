import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudConvertAuth, cloudConvertCommonProps } from '../auth';
import { createJob, extractExportedFiles, pollJobUntilDone } from '../common/client';

export const archiveFile = createAction({
  name: 'archive_file',
  displayName: 'Archive File(s)',
  description: 'Create an archive (ZIP, RAR, 7Z, TAR, TAR.GZ, TAR.BZ2) from multiple files.',
  auth: cloudConvertAuth,
  props: {
    inputUrls: Property.Array({
      displayName: 'Input File URLs',
      required: true,
    }),
    archiveFormat: Property.StaticDropdown({
      displayName: 'Archive Format',
      required: true,
      options: {
        options: [
          { label: 'zip', value: 'zip' },
          { label: 'rar', value: 'rar' },
          { label: '7z', value: '7z' },
          { label: 'tar', value: 'tar' },
          { label: 'tar.gz', value: 'tar.gz' },
          { label: 'tar.bz2', value: 'tar.bz2' }
        ],
      },
    }),
    filename: Property.ShortText({
      displayName: 'Archive Filename (optional)',
      required: false,
    }),
    ...cloudConvertCommonProps,
  },
  async run(context) {
    const auth = context.auth as string;
    const endpointOverride = context.propsValue['endpointOverride'] as string | undefined;

    const urls = (context.propsValue['inputUrls'] as string[]) ?? [];
    const format = context.propsValue['archiveFormat'] as string;
    const filename = context.propsValue['filename'] as string | undefined;
    const wait = context.propsValue['waitForCompletion'] as boolean;

    const tasks: Record<string, unknown> = {};
    const importNames: string[] = [];

    urls.forEach((u, i) => {
      const name = `import-${i + 1}`;
      tasks[name] = { operation: 'import/url', url: u };
      importNames.push(name);
    });

    tasks['archive-1'] = {
      operation: 'archive',
      input: importNames,
      output_format: format,
      ...(filename ? { filename } : {}),
    };

    tasks['export-1'] = {
      operation: 'export/url',
      input: 'archive-1',
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