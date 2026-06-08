import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfAuth } from '../common/auth';
import { filetopdfApiCall } from '../common/client';
import { CHROMIUM_OPTION_PROPS } from '../common/props';
import {
  stringifyOptions,
  buildConversionOutput,
  PdfJsonEnvelope,
} from '../common/conversion';

export const convertHtml = createAction({
  auth: filetopdfAuth,
  name: 'convert_html',
  displayName: 'Convert HTML',
  description: 'Render a raw HTML string (with optional CSS) to PDF using Chromium.',
  props: {
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML markup to render.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'Optional CSS, injected into the document head.',
      required: false,
    }),
    ...CHROMIUM_OPTION_PROPS,
  },
  async run(context) {
    const { html, css, ...rawOptions } = context.propsValue;
    const options = stringifyOptions(rawOptions);
    const body: Record<string, unknown> = { html, ...options };
    if (css) body['css'] = css;

    const envelope = await filetopdfApiCall<PdfJsonEnvelope>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/html',
      body,
    });

    return buildConversionOutput(context.files, envelope);
  },
});
