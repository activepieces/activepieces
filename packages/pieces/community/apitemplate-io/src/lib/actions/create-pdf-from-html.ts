import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { createPdfFromHtmlOutputSchema } from '../output-schemas';

export const createPdfFromHtml = createAction({
  auth: ApitemplateAuth,
  name: 'createPdfFromHtml',
  outputSchema: createPdfFromHtmlOutputSchema,
  classification: 'WRITE',
  displayName: 'Create PDF From HTML',
  description: 'Creates a PDF from HTML.',
  audience: 'both',
  aiMetadata: { description: 'Renders a new PDF directly from raw HTML (with optional CSS, templating data, and page settings such as size, orientation, margins, and headers/footers). Use when you have ad-hoc HTML markup rather than a saved template or a live URL. Requires the HTML body. Not idempotent: each call generates and stores a new PDF.', idempotent: false },
  propertyGroups: [
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'code',
      props: ['html', 'css', 'data'],
    },
    {
      key: 'page',
      display: 'section',
      label: 'Page Setup',
      icon: 'file',
      props: [
        'pageSize',
        'orientation',
        'marginTop',
        'marginBottom',
        'marginLeft',
        'marginRight',
        'printBackground',
      ],
    },
    {
      key: 'headerFooter',
      display: 'section',
      label: 'Header and Footer',
      icon: 'text',
      props: ['displayHeaderFooter', 'customHeader', 'customFooter', 'headerFontSize'],
    },
  ],
  props: {
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The page to turn into a PDF.',
      placeholder: '<h1>Invoice</h1>',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS',
      description: 'Styles applied to the HTML.',
      placeholder: 'h1 { color: #333; }',
      required: false,
    }),
    data: Property.Json({
      displayName: 'Template Data',
      description: 'Values for the placeholders in the HTML, as JSON.',
      required: false,
    }),
    pageSize: Property.StaticDropdown({
      displayName: 'Page Size',
      required: false,
      width: 'half',
      defaultValue: 'A4',
      options: {
        options: [
          { label: 'A4', value: 'A4' },
          { label: 'A3', value: 'A3' },
          { label: 'A5', value: 'A5' },
          { label: 'Letter', value: 'Letter' },
          { label: 'Legal', value: 'Legal' },
          { label: 'Tabloid', value: 'Tabloid' },
        ],
      },
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      required: false,
      width: 'half',
      defaultValue: 'portrait',
      options: {
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
    }),
    marginTop: Property.Number({
      displayName: 'Top Margin',
      description: 'In millimeters.',
      required: false,
      width: 'half',
    }),
    marginBottom: Property.Number({
      displayName: 'Bottom Margin',
      description: 'In millimeters.',
      required: false,
      width: 'half',
    }),
    marginLeft: Property.Number({
      displayName: 'Left Margin',
      description: 'In millimeters.',
      required: false,
      width: 'half',
    }),
    marginRight: Property.Number({
      displayName: 'Right Margin',
      description: 'In millimeters.',
      required: false,
      width: 'half',
    }),
    printBackground: Property.Checkbox({
      displayName: 'Print Backgrounds',
      description: 'Include background colors and images.',
      required: false,
      defaultValue: true,
    }),
    displayHeaderFooter: Property.Checkbox({
      displayName: 'Show Header and Footer',
      description: 'Print the header and footer below on every page.',
      required: false,
      defaultValue: false,
    }),
    customHeader: Property.LongText({
      displayName: 'Header HTML',
      description: 'Shown at the top of every page.',
      required: false,
    }),
    customFooter: Property.LongText({
      displayName: 'Footer HTML',
      description: 'Shown at the bottom of every page.',
      required: false,
    }),
    headerFontSize: Property.ShortText({
      displayName: 'Header Font Size',
      description: 'A CSS size.',
      placeholder: '9px',
      required: false,
    }),
    scale: Property.Number({
      displayName: 'Scale',
      description: 'Zoom from 0.1 to 2; 1 is actual size.',
      required: false,
      advanced: true,
    }),
    waitForTimeout: Property.Number({
      displayName: 'Wait Before Rendering',
      description: 'Milliseconds to wait for the page to finish loading.',
      required: false,
      advanced: true,
    }),
    expiration: Property.Number({
      displayName: 'Delete After',
      description: 'Minutes until the file is deleted, up to 10080. Empty or 0 keeps it.',
      required: false,
      advanced: true,
    }),
    meta: Property.ShortText({
      displayName: 'Your Reference',
      description: 'Your own ID for this file, to find it in List Objects.',
      placeholder: 'invoice-1042',
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const {
      html,
      css,
      data,
      expiration,
      pageSize,
      orientation,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      printBackground,
      headerFontSize,
      displayHeaderFooter,
      customHeader,
      customFooter,
      scale,
      waitForTimeout,
      meta,
    } = propsValue;

    // Build query parameters according to API docs
    const queryParams = new URLSearchParams();

    if (expiration !== undefined && expiration !== 0) {
      queryParams.append('expiration', expiration.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-pdf-from-html${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // Build settings object
    const settings: Record<string, unknown> = {};

    if (pageSize && pageSize !== 'A4') {
      settings['paper_size'] = pageSize;
    }

    if (orientation) {
      settings['orientation'] = orientation === 'landscape' ? '1' : '0';
    }

    if (marginTop !== undefined) {
      settings['margin_top'] = marginTop.toString();
    }

    if (marginBottom !== undefined) {
      settings['margin_bottom'] = marginBottom.toString();
    }

    if (marginLeft !== undefined) {
      settings['margin_left'] = marginLeft.toString();
    }

    if (marginRight !== undefined) {
      settings['margin_right'] = marginRight.toString();
    }

    if (printBackground !== undefined) {
      settings['print_background'] = printBackground ? '1' : '0';
    }

    if (headerFontSize) {
      settings['header_font_size'] = headerFontSize;
    }

    if (displayHeaderFooter !== undefined) {
      settings['displayHeaderFooter'] = displayHeaderFooter;
    }

    if (customHeader) {
      settings['custom_header'] = customHeader;
    }

    if (customFooter) {
      settings['custom_footer'] = customFooter;
    }

    if (scale !== undefined) {
      settings['scale'] = scale.toString();
    }

    if (waitForTimeout !== undefined) {
      settings['wait_for_timeout'] = waitForTimeout.toString();
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      body: html,
    };

    if (css) {
      requestBody['css'] = css;
    }

    if (data) {
      requestBody['data'] = data;
    }

    if (Object.keys(settings).length > 0) {
      requestBody['settings'] = settings;
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        endpoint,
        requestBody,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      return response;
    } catch (error: any) {
     
      if (error.message.includes('502') && authConfig.region !== 'default') {
        throw new Error(
          `${error.message}\n\nThe ${authConfig.region} region appears to be experiencing issues. ` +
          `Consider switching to the 'default' region in your authentication settings or try again later.`
        );
      }
      throw error;
    }
  },
});