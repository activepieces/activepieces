import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPdfFromHtml = createAction({
  auth: ApitemplateAuth,
  name: 'createPdfFromHtml',
  displayName: 'Create PDF From HTML',
  description: 'Creates a PDF from HTML.',
  props: {
    html: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML content to convert to PDF. Can include CSS styles and external resources.',
      required: true,
    }),
    css: Property.LongText({
      displayName: 'CSS Styles',
      description: 'Optional CSS styles to apply to the HTML content. Can include inline styles or external stylesheets.',
      required: false,
    }),
    data: Property.Json({
      displayName: 'Data for Templating',
      description: 'Optional JSON data to use for templating the HTML content. Can include variables and dynamic content.',
      required: false,
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description: 'Expiration of the generated PDF in minutes. Use 0 to store permanently, or 1-10080 minutes (7 days) to specify expiration.',
      required: false,
    }),
    pageSize: Property.StaticDropdown({
      displayName: 'Page Size',
      description: 'PDF page size format',
      required: false,
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
      displayName: 'Page Orientation',
      description: 'PDF page orientation',
      required: false,
      defaultValue: 'portrait',
      options: {
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
    }),
    marginTop: Property.Number({
      displayName: 'Margin Top (mm)',
      description: 'Top margin in millimeters',
      required: false,
    }),
    marginBottom: Property.Number({
      displayName: 'Margin Bottom (mm)',
      description: 'Bottom margin in millimeters',
      required: false,
    }),
    marginLeft: Property.Number({
      displayName: 'Margin Left (mm)',
      description: 'Left margin in millimeters',
      required: false,
    }),
    marginRight: Property.Number({
      displayName: 'Margin Right (mm)',
      description: 'Right margin in millimeters',
      required: false,
    }),
    printBackground: Property.Checkbox({
      displayName: 'Print Background',
      description: 'Whether to print background graphics and colors',
      required: false,
      defaultValue: true,
    }),
    headerFontSize: Property.ShortText({
      displayName: 'Header Font Size',
      description: 'Font size for header (e.g., "9px")',
      required: false,
    }),
    displayHeaderFooter: Property.Checkbox({
      displayName: 'Display Header/Footer',
      description: 'Whether to display header and footer',
      required: false,
      defaultValue: false,
    }),
    customHeader: Property.LongText({
      displayName: 'Custom Header HTML',
      description: 'Custom HTML content for header',
      required: false,
    }),
    customFooter: Property.LongText({
      displayName: 'Custom Footer HTML',
      description: 'Custom HTML content for footer',
      required: false,
    }),
    scale: Property.Number({
      displayName: 'Scale',
      description: 'Scale factor for the PDF (0.1 to 2.0)',
      required: false,
    }),
    waitForTimeout: Property.Number({
      displayName: 'Wait Timeout (ms)',
      description: 'Time to wait before generating PDF (in milliseconds)',
      required: false,
    }),
    meta: Property.ShortText({
      displayName: 'External Reference ID',
      description: 'Specify an external reference ID for your own reference',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth as ApitemplateAuthConfig;
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
    const settings: any = {};

    if (pageSize && pageSize !== 'A4') {
      settings.paper_size = pageSize;
    }

    if (orientation) {
      settings.orientation = orientation === 'landscape' ? '1' : '0';
    }

    if (marginTop !== undefined) {
      settings.margin_top = marginTop.toString();
    }

    if (marginBottom !== undefined) {
      settings.margin_bottom = marginBottom.toString();
    }

    if (marginLeft !== undefined) {
      settings.margin_left = marginLeft.toString();
    }

    if (marginRight !== undefined) {
      settings.margin_right = marginRight.toString();
    }

    if (printBackground !== undefined) {
      settings.print_background = printBackground ? '1' : '0';
    }

    if (headerFontSize) {
      settings.header_font_size = headerFontSize;
    }

    if (displayHeaderFooter !== undefined) {
      settings.displayHeaderFooter = displayHeaderFooter;
    }

    if (customHeader) {
      settings.custom_header = customHeader;
    }

    if (customFooter) {
      settings.custom_footer = customFooter;
    }

    if (scale !== undefined) {
      settings.scale = scale.toString();
    }

    if (waitForTimeout !== undefined) {
      settings.wait_for_timeout = waitForTimeout.toString();
    }

    // Build request body
    const requestBody: any = {
      body: html,
    };

    if (css) {
      requestBody.css = css;
    }

    if (data) {
      requestBody.data = data;
    }

    if (Object.keys(settings).length > 0) {
      requestBody.settings = settings;
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        endpoint,
        requestBody,
        undefined,
        authConfig.region
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