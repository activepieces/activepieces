import { createAction, Property } from '@activepieces/pieces-framework';
import { filetopdfAuth } from '../auth';
import { filetopdfApi } from '../common/api';
import { filetopdfProps } from '../common/props';
import { filetopdfUtils } from '../common/utils';
import { conversionOutputSchema } from '../output-schemas';

export const convertHtmlAction = createAction({
  auth: filetopdfAuth,
  name: 'convert_html',
  outputSchema: conversionOutputSchema,
  classification: 'READ',
  displayName: 'Convert HTML',
  description: 'Render a raw HTML string (with optional CSS) to PDF using Chromium.',
  audience: 'human',
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
    const envelope = await filetopdfApi.convertHtml({ auth: context.auth, html, css, options });
    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});
