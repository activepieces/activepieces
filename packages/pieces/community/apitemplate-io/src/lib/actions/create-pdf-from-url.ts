import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { createPdfFromHtmlOutputSchema } from '../output-schemas';

export const createPdfFromUrl = createAction({
  auth: ApitemplateAuth,
  name: 'createPdfFromUrl',
  outputSchema: createPdfFromHtmlOutputSchema,
  classification: 'WRITE',
  displayName: 'Create PDF From URL',
  description: 'Creates a PDF from a webpage URL.',
  audience: 'both',
  aiMetadata: { description: 'Renders a new PDF by loading and capturing a live webpage at the given URL, with optional page settings (size, orientation, margins), viewport sizing, full-page capture, and wait-for-selector/timeout controls for dynamic content. Use when the source is a public web page rather than supplied HTML or a saved template. Requires the URL. Not idempotent: each call generates and stores a new PDF.', idempotent: false },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Web Page',
      icon: 'file',
      props: ['url', 'waitForSelector', 'waitForTimeout'],
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
        'displayHeaderFooter',
      ],
    },
    {
      key: 'browser',
      display: 'section',
      label: 'Browser Window',
      icon: 'sliders',
      props: ['viewportWidth', 'viewportHeight', 'fullPage'],
    },
  ],
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The web page to turn into a PDF.',
      placeholder: 'https://example.com/invoice',
      required: true,
    }),
    waitForSelector: Property.ShortText({
      displayName: 'Wait for Element',
      description: 'CSS selector that must appear before rendering.',
      placeholder: '.content-loaded',
      required: false,
    }),
    waitForTimeout: Property.Number({
      displayName: 'Wait Before Rendering',
      description: 'Milliseconds to wait for the page to finish loading.',
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
      displayName: 'Header and Footer',
      description: 'Add a header and footer to every page.',
      required: false,
      defaultValue: false,
      reveals: ['customHeader', 'customFooter', 'headerFontSize'],
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
    viewportWidth: Property.Number({
      displayName: 'Window Width',
      description: 'In pixels.',
      required: false,
      width: 'half',
      defaultValue: 1920,
    }),
    viewportHeight: Property.Number({
      displayName: 'Window Height',
      description: 'In pixels.',
      required: false,
      width: 'half',
      defaultValue: 1080,
    }),
    fullPage: Property.Checkbox({
      displayName: 'Full Page',
      description: 'Capture the whole scrollable page, not just the window.',
      required: false,
      defaultValue: true,
    }),
    scale: Property.Number({
      displayName: 'Scale',
      description: 'Zoom from 0.1 to 2; 1 is actual size.',
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
      url,
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
      waitForSelector,
      viewportWidth,
      viewportHeight,
      fullPage,
      meta,
    } = propsValue;

    // Build query parameters for basic options
    const queryParams = new URLSearchParams();


    if (expiration !== undefined && expiration !== 0) {
      queryParams.append('expiration', expiration.toString());
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/create-pdf-from-url${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // Build settings object for page configuration
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

    if (waitForSelector) {
      settings['wait_for_selector'] = waitForSelector;
    }

    if (viewportWidth !== undefined && viewportWidth !== 1920) {
      settings['viewport_width'] = viewportWidth.toString();
    }

    if (viewportHeight !== undefined && viewportHeight !== 1080) {
      settings['viewport_height'] = viewportHeight.toString();
    }

    if (fullPage !== undefined) {
      settings['full_page'] = fullPage ? '1' : '0';
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      url: url,
    };

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