import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../../index';
import { ccRequest, sleep } from '../common/client';

export const captureWebsiteAction = createAction({
  auth: cloudconvertAuth,
  name: 'capture_website',
  displayName: 'Capture a Website',
  description: 'Capture webpage as PDF/PNG/JPG and return download URLs.',
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
    }),
    output_format: Property.StaticDropdown({
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
    full_page: Property.Checkbox({
      displayName: 'Full Page',
      required: false,
      defaultValue: true,
    }),
    wait_for_completion: Property.Checkbox({
      displayName: 'Wait for Completion',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth as string;
    const { url, output_format, full_page, wait_for_completion } = propsValue;

    const create = await ccRequest<any>(token, HttpMethod.POST, '/jobs', {
      tasks: {
        'capture': {
          operation: 'capture-website',
          url,
          output_format,
          full_page,
        },
        'export': {
          operation: 'export/url',
          input: 'capture',
        },
      },
      tag: 'activepieces',
    });

    const job = create.body?.data;
    if (!wait_for_completion) return job;

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

