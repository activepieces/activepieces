import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../../index';
import { ccRequest, sleep } from '../common/client';

export const convertFileAction = createAction({
  auth: cloudconvertAuth,
  name: 'convert_file',
  displayName: 'Convert a File',
  description:
    'Create a conversion job (import URL → convert → export URL) and return download URLs.',
  props: {
    input_url: Property.ShortText({
      displayName: 'Input File URL',
      description: 'Publicly accessible URL to the source file.',
      required: true,
    }),
    output_format: Property.ShortText({
      displayName: 'Output Format',
      description: 'Desired output format (e.g., pdf, png, mp3).',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Output Filename (optional)',
      required: false,
    }),
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Poll the job until completion to return export URLs.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const { input_url, output_format, filename, wait_for_completion } = propsValue;

    const tasks = {
      'import-my-file': {
        operation: 'import/url',
        url: input_url,
      },
      'convert-my-file': {
        operation: 'convert',
        input: 'import-my-file',
        output_format,
      } as Record<string, unknown>,
      'export-my-file': {
        operation: 'export/url',
        input: 'convert-my-file',
      } as Record<string, unknown>,
    } as Record<string, any>;

    if (filename) {
      tasks['export-my-file'].filename = filename;
    }

    const create = await ccRequest<any>(token, HttpMethod.POST, '/jobs', {
      tasks,
      tag: 'activepieces',
    });

    const job = create.body?.data;
    if (!wait_for_completion) {
      return job;
    }

    // poll
    const id = job?.id;
    for (let i = 0; i < 15; i++) {
      const g = await ccRequest<any>(token, HttpMethod.GET, `/jobs/${id}`);
      const state = g.body?.data?.status;
      if (state === 'finished' || state === 'error') {
        const tasksArr = g.body?.data?.tasks ?? [];
        const exports = tasksArr.filter((t: any) => t.operation === 'export/url');
        const files = exports.flatMap((e: any) => e.result?.files || []);
        return { status: state, files };
      }
      await sleep(2000);
    }
    return { status: 'timeout', id };
  },
});

