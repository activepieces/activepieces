import { createAction, Property } from '@activepieces/pieces-framework';
import { filetopdfAuth } from '../../auth';
import { filetopdfAiProps } from '../../common/ai-props';
import { filetopdfApi } from '../../common/api';
import { filetopdfUtils } from '../../common/utils';
import { conversionOutputSchema } from '../../output-schemas';

export const aiConvertMarkdownAction = createAction({
  auth: filetopdfAuth,
  name: 'filetopdf_convert_markdown',
  outputSchema: conversionOutputSchema,
  displayName: 'Convert Markdown to PDF',
  description: 'Render a Markdown string to a styled PDF file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renders a GitHub Flavored Markdown string to a styled PDF file and returns the file. A clean default stylesheet applies unless you pass CSS, which replaces it. Pick it when you hold Markdown text; use Convert HTML to PDF for HTML and Convert File to PDF for an existing file or URL. Every call spends one conversion credit (Get Account Status shows what is left), and any option needs the Pro or Scale plan or the free trial.',
    idempotent: false,
  },
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown',
      description: 'The Markdown to render (GitHub Flavored Markdown). Images must load from public URLs.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'CSS that replaces the default stylesheet. Omit to keep the default styling.',
      required: false,
    }),
    ...filetopdfAiProps.chromiumOptions,
  },
  async run(context) {
    const { markdown, css, additionalOptions, ...rawOptions } = context.propsValue;
    const options = filetopdfUtils.buildAiOptions({ additionalOptions, options: rawOptions });
    const envelope = await filetopdfApi.convertMarkdown({ auth: context.auth, markdown, css, options });
    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});
