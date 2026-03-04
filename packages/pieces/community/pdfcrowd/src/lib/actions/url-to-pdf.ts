import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { CONVERT_URL, getAuthHeader } from '../common/client';
import FormData from 'form-data';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const urlToPdfAction = createAction({
  auth: pdfcrowdAuth,
  name: 'url_to_pdf',
  displayName: 'Convert URL to PDF',
  description: 'Convert a web page URL to PDF document',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'The URL of the web page to convert. Must be publicly accessible.',
      required: true,
    }),
    outputFilename: Property.ShortText({
      displayName: 'Output Filename',
      description: 'The filename for the generated PDF',
      required: false,
      defaultValue: 'document.pdf',
    }),
    page_size: Property.StaticDropdown({
      displayName: 'Page Size',
      description:
        'Set the output page size using standard formats (A4, Letter, A3, etc.).',
      required: false,
      options: {
        options: [
          { label: 'A0', value: 'A0' },
          { label: 'A1', value: 'A1' },
          { label: 'A2', value: 'A2' },
          { label: 'A3', value: 'A3' },
          { label: 'A4', value: 'A4' },
          { label: 'A5', value: 'A5' },
          { label: 'A6', value: 'A6' },
          { label: 'Letter', value: 'Letter' },
        ],
      },
      defaultValue: 'A4',
    }),
    page_width: Property.ShortText({
      displayName: 'Page Width',
      description:
        'Set custom page width (e.g., "8.27in", "210mm"). The safe maximum is 200in.',
      required: false,
    }),
    page_height: Property.ShortText({
      displayName: 'Page Height',
      description:
        'Set custom page height. Set to "-1" for a single-page PDF that expands to fit all content.',
      required: false,
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      description: 'Set the output page orientation.',
      required: false,
      options: {
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
      defaultValue: 'portrait',
    }),
    margin_top: Property.ShortText({
      displayName: 'Margin Top',
      description:
        'Control white space at the top of the page (e.g., "0.4in", "10mm").',
      required: false,
      defaultValue: '0.4in',
    }),
    margin_right: Property.ShortText({
      displayName: 'Margin Right',
      description: 'Control white space on the right edge of the page.',
      required: false,
      defaultValue: '0.4in',
    }),
    margin_bottom: Property.ShortText({
      displayName: 'Margin Bottom',
      description: 'Control white space at the bottom of the page.',
      required: false,
      defaultValue: '0.4in',
    }),
    margin_left: Property.ShortText({
      displayName: 'Margin Left',
      description: 'Control white space on the left edge of the page.',
      required: false,
      defaultValue: '0.4in',
    }),
    content_viewport_width: Property.StaticDropdown({
      displayName: 'Content Viewport Width',
      description: 'Set the viewport width for formatting the HTML content.',
      required: false,
      options: {
        options: [
          { label: 'Balanced', value: 'balanced' },
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Extra Large', value: 'extra-large' },
        ],
      },
      defaultValue: 'medium',
    }),
    custom_css: Property.LongText({
      displayName: 'Custom CSS',
      description:
        'Apply custom CSS to modify the visual appearance and layout of your content.',
      required: false,
    }),
    custom_javascript: Property.LongText({
      displayName: 'Custom JavaScript',
      description:
        'Run custom JavaScript after the document is loaded and ready to print.',
      required: false,
    }),
    element_to_convert: Property.ShortText({
      displayName: 'Element To Convert',
      description:
        'Convert only the specified element using CSS selector (e.g., "#content", ".article").',
      required: false,
    }),
    header_html: Property.LongText({
      displayName: 'Header HTML',
      description: 'HTML content for the page header.',
      required: false,
    }),
    header_url: Property.LongText({
      displayName: 'Header URL',
      description: 'URL of the page header HTML.',
      required: false,
    }),
    footer_html: Property.LongText({
      displayName: 'Footer HTML',
      description: 'HTML content for the page footer.',
      required: false,
    }),
    footer_url: Property.LongText({
      displayName: 'Footer URL',
      description: 'URL of the page footer HTML.',
      required: false,
    }),
    page_watermark: Property.File({
      displayName: 'Page Watermark',
      description: 'Apply a watermark PDF overlay to every page of the output.',
      required: false,
    }),
    multipage_watermark: Property.File({
      displayName: 'Multipage Watermark',
      description:
        'Apply each page of a watermark PDF to corresponding output pages.',
      required: false,
    }),
    page_background: Property.File({
      displayName: 'Page Background',
      description: 'Apply a background PDF to every page of the output.',
      required: false,
    }),
    multipage_background: Property.File({
      displayName: 'Multipage Background',
      description:
        'Apply each page of a background PDF to corresponding output pages.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const formData = new FormData();
    formData.append('url', propsValue.url);

    const basicOptions = [
      'page_size',
      'page_width',
      'page_height',
      'orientation',
      'margin_top',
      'margin_right',
      'margin_bottom',
      'margin_left',
      'content_viewport_width',
      'custom_css',
      'custom_javascript',
      'element_to_convert',
      'header_html',
      'header_url',
      'footer_html',
      'footer_url',
    ];

    for (const opt of basicOptions) {
      const value = propsValue[opt as keyof typeof propsValue];
      if (value !== undefined && value !== null && value !== '') {
        formData.append(opt, String(value));
      }
    }

    const fileOptions = [
      'page_watermark',
      'multipage_watermark',
      'page_background',
      'multipage_background',
    ];

    for (const opt of fileOptions) {
      const fileValue = propsValue[opt as keyof typeof propsValue] as
        | { data: Buffer; filename: string }
        | undefined;
      if (fileValue?.data) {
        formData.append(opt, fileValue.data, {
          filename: fileValue.filename || `${opt}.pdf`,
        });
      }
    }

    const formBuffer = formData.getBuffer();
    const response = await httpClient.sendRequest({
      url: CONVERT_URL,
      method: HttpMethod.POST,
      headers: {
        Authorization: getAuthHeader(auth),
        'User-Agent': 'pdfcrowd-activepieces/0.0.1',
        ...formData.getHeaders(),
      },
      body: formBuffer,
    });

    const filename = propsValue.outputFilename || 'document.pdf';

    const file = await context.files.write({
      fileName: filename,
      data: Buffer.from(response.body),
    });
    const headers = response.headers || {};
    return {
      file,
      filename,
      jobId: headers['x-pdfcrowd-job-id'] || '',
      pageCount: headers['x-pdfcrowd-pages'] || '0',
      outputSize: headers['x-pdfcrowd-output-size'] || '0',
      consumedCredits: headers['x-pdfcrowd-consumed-credits'] || '0',
      remainingCredits: headers['x-pdfcrowd-remaining-credits'] || '0',
    };
  },
});
