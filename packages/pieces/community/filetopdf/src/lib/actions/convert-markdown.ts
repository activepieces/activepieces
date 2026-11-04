import { createAction, Property } from '@activepieces/pieces-framework';
import { filetopdfAuth } from '../auth';
import { filetopdfApi } from '../common/api';
import { filetopdfProps } from '../common/props';
import { filetopdfUtils } from '../common/utils';
import { conversionOutputSchema } from '../output-schemas';

export const convertMarkdownAction = createAction({
  auth: filetopdfAuth,
  name: 'convert_markdown',
  outputSchema: conversionOutputSchema,
  classification: 'READ',
  displayName: 'Convert Markdown',
  description:
    'Render a raw Markdown string (with optional CSS) to PDF. A sensible default stylesheet is applied when no CSS is provided.',
  audience: 'human',
  aiMetadata: {
    description:
      'Renders a raw Markdown string to PDF, applying a default stylesheet when no CSS is supplied (custom CSS overrides it). Choose this when the agent holds Markdown text it generated or assembled in memory, rather than a file, URL, or HTML. Requires the Markdown content as input. Not idempotent: each call performs a fresh remote render on the FileToPDF service that produces a new file and consumes account credits.',
    idempotent: false,
  },
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown',
      description: 'The Markdown content to render.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'Optional CSS to style the rendered Markdown. Overrides the default stylesheet.',
      required: false,
    }),
    ...filetopdfProps.chromiumOptions,
  },
  async run(context) {
    const { markdown, css, ...rawOptions } = context.propsValue;
    const options = filetopdfUtils.stringifyOptions(rawOptions);
    const envelope = await filetopdfApi.convertMarkdown({ auth: context.auth, markdown, css, options });
    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});
