import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { peekshotAuth } from '../../index';
import { projectId } from '../common/props';
import {
  CreateScreenshotResponse,
  GetScreenshotResponse,
} from '../common/types';

export const captureScreenshot = createAction({
  auth: peekshotAuth,
  name: 'captureScreenshot',
  displayName: 'Capture Screenshot',
  description: 'Captures Screenshot of a URL.',
  props: {
    projectId: projectId,
    url: Property.ShortText({ displayName: 'Target URL', required: true }),
    width: Property.ShortText({
      displayName: 'Custom Screenshot Width',
      required: false,
    }),
    height: Property.ShortText({
      displayName: 'Custom Screenshot Height',
      required: false,
    }),
    file_type: Property.StaticDropdown({
      displayName: 'Image Format',
      description: 'Output format for the screenshot.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPEG', value: 'jpeg' },
        ],
      },
    }),
    inject_css: Property.LongText({
      displayName: 'Custom CSS',
      description: 'Custom CSS to apply.',
      required: false,
    }),
    inject_js: Property.LongText({
      displayName: 'Custom JavaScript',
      description: 'Custom JavaScript to apply.',
      required: false,
    }),
    full_page: Property.Checkbox({
      displayName: 'Full Page?',
      description: 'To capture the entire page.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      projectId,
      url,
      width,
      height,
      file_type,
      full_page,
      inject_css,
      inject_js,
    } = propsValue;

    const res = await httpClient.sendRequest<CreateScreenshotResponse>({
      method: HttpMethod.POST,
      url: 'https://api.peekshot.com/api/v1/screenshots',
      headers: {
        'x-api-key': auth as string,
        'Content-Type': 'application/json',
      },
      body: {
        project_id: projectId.toString(),
        url,
        width,
        height,
        inject_css,
        inject_js,
        file_type,
        full_page: full_page ? 'true' : 'false',
      },
    });

    // Handle error in initial response
    if (!res.body || !res.body.data || !res.body.data.requestId) {
      throw new Error('Failed to initiate screenshot request');
    }

    const requestId = res.body.data.requestId;
    let status = res.body.status;
    const timeoutAt = Date.now() + 5 * 60 * 1000;

    while (status !== 'COMPLETE' && Date.now() < timeoutAt) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 seconds

      const pollRes = await httpClient.sendRequest<GetScreenshotResponse>({
        method: HttpMethod.GET,
        url: `https://api.peekshot.com/api/v1/screenshots/${requestId}`,
        headers: {
          'x-api-key': auth as string,
          'Content-Type': 'application/json',
        },
      });

      status = pollRes.body?.data?.status;

      if (status === 'COMPLETE') {
        return pollRes.body; // Screenshot is ready
      }
    }

    throw new Error('Screenshot generation timed out or failed.');
  },
});
