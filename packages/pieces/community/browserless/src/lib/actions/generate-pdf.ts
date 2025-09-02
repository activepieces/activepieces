import { createAction } from '@activepieces/pieces-framework';
import { pdf_props } from '../common/props';
import { makeRequest, handleBinaryResponse } from '../common/requests';
import { validate_props } from '../common/validations';

export const generate_pdf = createAction({
  name: 'generate_pdf',
  displayName: 'Generate PDF',
  description: 'Generate a PDF of the given URL or HTML.',
  props: pdf_props,
  async run(context) {
    // Add validation without changing structure
    await validate_props.generate_pdf(context.propsValue);

    const url = context.propsValue.page_url;
    const html = context.propsValue.raw_html;
    const displayHeaderFooter = context.propsValue.display_header_footer;
    const printBackground = context.propsValue.print_background_graphics;
    const format = context.propsValue.page_format || 'A4';
    const token = context.auth as string;

    if (!url && !html) {
      throw new Error('Either URL or HTML must be provided');
    }

    const response = await makeRequest('/pdf', token, {
      url,
      html,
      options: {
        displayHeaderFooter,
        printBackground,
        format
      }
    });

    const pdf_base64 = await handleBinaryResponse(response);
    return {
      pdf_base64,
      format
    };
  }
});
