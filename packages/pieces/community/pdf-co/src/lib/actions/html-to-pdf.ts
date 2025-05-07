import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../..';

export const htmlToPdf = createAction({
  name: 'html_to_pdf',
  displayName: 'HTML to PDF',
  auth: pdfCoAuth,
  description: 'Convert HTML or a webpage (URL) into a downloadable PDF (e.g., invoice, report).',
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML content to convert to PDF',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the generated PDF file (e.g. result.pdf)',
      required: false,
      defaultValue: 'result.pdf',
    }),
    margins: Property.ShortText({
      displayName: 'Margins',
      description: 'CSS style margins (e.g. "10px" for all sides or "5px 5px 5px 5px" for top, right, bottom, left)',
      required: false,
      defaultValue: '5px 5px 5px 5px',
    }),
    paperSize: Property.StaticDropdown({
      displayName: 'Paper Size',
      description: 'Size of the PDF page',
      required: false,
      defaultValue: 'Letter',
      options: {
        disabled: false,
        placeholder: 'Select paper size',
        options: [
          { label: 'Letter', value: 'Letter' },
          { label: 'Legal', value: 'Legal' },
          { label: 'Tabloid', value: 'Tabloid' },
          { label: 'Ledger', value: 'Ledger' },
          { label: 'A0', value: 'A0' },
          { label: 'A1', value: 'A1' },
          { label: 'A2', value: 'A2' },
          { label: 'A3', value: 'A3' },
          { label: 'A4', value: 'A4' },
          { label: 'A5', value: 'A5' },
          { label: 'A6', value: 'A6' }
        ]
      }
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      description: 'Page orientation',
      required: false,
      defaultValue: 'Portrait',
      options: {
        disabled: false,
        placeholder: 'Select orientation',
        options: [
          { label: 'Portrait', value: 'Portrait' },
          { label: 'Landscape', value: 'Landscape' }
        ]
      }
    }),
    printBackground: Property.Checkbox({
      displayName: 'Print Background',
      description: 'Whether to print background graphics',
      required: false,
      defaultValue: true,
    }),
    header: Property.LongText({
      displayName: 'Header HTML',
      description: 'HTML for the header to be applied on every page',
      required: false,
    }),
    footer: Property.LongText({
      displayName: 'Footer HTML',
      description: 'HTML for the footer to be applied on every page',
      required: false,
    }),
    mediaType: Property.StaticDropdown({
      displayName: 'Media Type',
      description: 'Media type to use for rendering',
      required: false,
      defaultValue: 'print',
      options: {
        disabled: false,
        placeholder: 'Select media type',
        options: [
          { label: 'Print', value: 'print' },
          { label: 'Screen', value: 'screen' },
          { label: 'None', value: 'none' }
        ]
      }
    }),
    doNotWaitFullLoad: Property.Checkbox({
      displayName: 'Do Not Wait for Full Load',
      description: 'Skip waiting for full page load (e.g., videos)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const requestBody = {
      html: context.propsValue.html,
      name: context.propsValue.name,
      margins: context.propsValue.margins,
      paperSize: context.propsValue.paperSize,
      orientation: context.propsValue.orientation,
      printBackground: context.propsValue.printBackground,
      header: context.propsValue.header,
      footer: context.propsValue.footer,
      mediaType: context.propsValue.mediaType,
      DoNotWaitFullLoad: context.propsValue.doNotWaitFullLoad,
      async: false
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pdf.co/v1/pdf/convert/from/html',
      headers: {
        'x-api-key': context.auth,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    if (response.status === 200) {
      return response.body;
    } else {
      throw new Error(`PDF conversion failed: ${response.body?.message || response.status}`);
    }
  },
});
