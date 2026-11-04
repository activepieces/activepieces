import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfAuth } from '../auth';
import { filetopdfClient } from '../common/client';
import { filetopdfProps } from '../common/props';
import { filetopdfUtils } from '../common/utils';
import type { FiletopdfPdfEnvelope } from '../common/types';

export const convertHtmlAction = createAction({
  auth: filetopdfAuth,
  name: 'convert_html',
  classification: 'READ',
  displayName: 'Convert HTML',
  description: 'Render a raw HTML string (with optional CSS) to PDF using Chromium.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renders a raw HTML string (with optional injected CSS) to PDF via Chromium. Choose this when the agent holds HTML markup it generated or assembled in memory, rather than a file or URL. Requires the HTML content as input. Not idempotent: each call performs a fresh remote render on the FileToPDF service that produces a new file and consumes account credits.',
    idempotent: false,
  },
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
    ...filetopdfProps.chromiumOptions,
  },
  async run(context) {
    const { html, css, ...rawOptions } = context.propsValue;
    const options = filetopdfUtils.stringifyOptions(rawOptions);
    const body: Record<string, unknown> = { html, ...options };
    if (css) body['css'] = css;

    const envelope = await filetopdfClient.request<FiletopdfPdfEnvelope>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/html',
      body,
    });

    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});
