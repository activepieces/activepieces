import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linkupAuth } from '../common/auth';
import { linkupApiCall } from '../common/client';

export const fetch = createAction({
  auth: linkupAuth,
  name: 'fetch',
  displayName: 'Fetch Webpage',
  description: 'Fetch a webpage and convert it to markdown format. Optionally render JavaScript, include raw HTML, or extract images.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the webpage to fetch',
      required: true,
    }),
    renderJs: Property.Checkbox({
      displayName: 'Render JavaScript',
      description: 'Render JavaScript on the webpage before fetching',
      required: false,
      defaultValue: false,
    }),
    includeRawHtml: Property.Checkbox({
      displayName: 'Include Raw HTML',
      description: 'Include the raw HTML in the response',
      required: false,
      defaultValue: false,
    }),
    extractImages: Property.Checkbox({
      displayName: 'Extract Images',
      description: 'Extract images from the webpage',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { url, renderJs, includeRawHtml, extractImages } = context.propsValue;

    const body: Record<string, any> = {
      url,
    };

    if (renderJs !== undefined) {
      body['renderJs'] = renderJs;
    }

    if (includeRawHtml !== undefined) {
      body['includeRawHtml'] = includeRawHtml;
    }

    if (extractImages !== undefined) {
      body['extractImages'] = extractImages;
    }

    return await linkupApiCall({
      method: HttpMethod.POST,
      path: '/v1/fetch',
      body,
      auth: context.auth,
    });
  },
});

