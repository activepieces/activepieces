import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const htmlToPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'html_to_pdf',
  displayName: 'HTML to PDF',
  description: 'Convert a publicly accessible web page URL into a PDF.',
  props: {
    url: Property.ShortText({
      displayName: 'Page URL',
      description: 'Public URL of the web page to render as PDF.',
      required: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const { url, output_filename, packaged_filename } = context.propsValue;

    if (!url || !/^https?:\/\//i.test(url)) {
      throw new Error('A valid http(s) URL is required.');
    }

    return await runAndStoreResult({
      auth:context.auth.secret_text,
      files: context.files,
      tool: 'htmlpdf',
      uploads: [{ kind: 'url', url }],
      output_filename,
      packaged_filename,
    });
  },
});
