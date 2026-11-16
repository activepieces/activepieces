import { createAction, Property } from '@activepieces/pieces-framework';
import { filetopdfAuth } from '../../auth';
import { filetopdfAiProps } from '../../common/ai-props';
import { filetopdfApi } from '../../common/api';
import { filetopdfUtils } from '../../common/utils';
import { conversionOutputSchema } from '../../output-schemas';

export const aiConvertHtmlAction = createAction({
  auth: filetopdfAuth,
  name: 'filetopdf_convert_html',
  outputSchema: conversionOutputSchema,
  displayName: 'Convert HTML to PDF',
  description: 'Render an HTML string to a PDF file with Chromium.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renders an HTML string (a full document or a fragment) to a PDF file with headless Chromium and returns the file. Pick it when you hold HTML markup; use Convert Markdown to PDF for Markdown text and Convert File to PDF for an existing file or URL. Every call spends one conversion credit (Get Account Status shows what is left), and any option needs the Pro or Scale plan or the free trial.',
    idempotent: false,
  },
  props: {
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML to render. Images, fonts and CSS must load from public URLs.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'CSS injected as a <style> block into the document head. Omit if the HTML carries its own styles.',
      required: false,
    }),
    ...filetopdfAiProps.chromiumOptions,
  },
  async run(context) {
    const { html, css, additionalOptions, ...rawOptions } = context.propsValue;
    const options = filetopdfUtils.buildAiOptions({ additionalOptions, options: rawOptions });
    const envelope = await filetopdfApi.convertHtml({ auth: context.auth, html, css, options });
    return await filetopdfUtils.buildConversionOutput({ files: context.files, envelope });
  },
});

