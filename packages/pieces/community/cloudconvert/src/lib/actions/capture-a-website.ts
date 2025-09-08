import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudConvertAuth, cloudConvertCommonProps } from '../auth';
import { createJob, extractExportedFiles, pollJobUntilDone } from '../common/client';

export const captureWebsite = createAction({
  name: 'capture_website',
  displayName: 'Capture a Website',
  description: 'Capture a webpage as PDF, PNG, or JPG from a URL.',
  auth: cloudConvertAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
        ],
      },
    }),
    viewport: Property.ShortText({
      displayName: 'Viewport (e.g., 1366x768)',
      required: false,
    }),
    delay: Property.Number({
      displayName: 'Delay (ms)',
      description: 'Wait time before capture.',
      required: false,
    }),
    waitUntil: Property.StaticDropdown({
      displayName: 'Wait Until',
      description: 'Which event to wait for before capture.',
      required: false,
      options: {
        options: [
          { label: 'load', value: 'load' },
          { label: 'domcontentloaded', value: 'domcontentloaded' },
          { label: 'networkidle0', value: 'networkidle0' },
          { label: 'networkidle2', value: 'networkidle2' }
        ],
      },
    }),
    quality: Property.Number({
      displayName: 'Quality (JPG)',
      description: '0-100, applies to JPG output.',
      required: false,
    }),
    ...cloudConvertCommonProps,
  },
  async run(context) {
    const auth = context.auth as string;
    const endpointOverride = context.propsValue['endpointOverride'] as string | undefined;

    const url = context.propsValue['url'] as string;
    const outputFormat = context.propsValue['outputFormat'] as string;
    const viewport = context.propsValue['viewport'] as string | undefined;
    const delay = context.propsValue['delay'] as number | undefined;
    const waitUntil = context.propsValue['waitUntil'] as string | undefined;
    const quality = context.propsValue['quality'] as number | undefined;
    const wait = context.propsValue['waitForCompletion'] as boolean;

    const tasks = {
      'capture-1': {
        operation: 'capture-website',
        url,
        output_format: outputFormat,
        ...(viewport ? { viewport } : {}),
        ...(delay ? { delay } : {}),
        ...(waitUntil ? { wait_until: waitUntil } : {}),
        ...(quality ? { quality } : {}),
      },
      'export-1': {
        operation: 'export/url',
        input: 'capture-1',
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