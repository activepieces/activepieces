import { Property } from '@activepieces/pieces-framework';

const baseProperties = {
  addScriptTag: Property.Array({
    displayName: 'Add Script Tag',
    description: 'An array of script tags to include in the webpage.',
    required: false,
    properties: {
      url: Property.ShortText({
        displayName: 'Script URL',
        description: 'The URL of the script to include in the webpage.',
        required: false,
      }),
      path: Property.ShortText({
        displayName: 'Script Path',
        description: 'The path of the script to include in the webpage.',
        required: false,
      }),
      content: Property.LongText({
        displayName: 'Script Content',
        description: 'The content of the script to include in the webpage.',
        required: false,
      }),
      type: Property.ShortText({
        displayName: 'Script Type',
        description: 'The type of the script to include in the webpage.',
        required: false,
      }),
      id: Property.ShortText({
        displayName: 'Script ID',
        description: 'The ID of the script to include in the webpage.',
        required: false,
      }),
    },
  }),
  addStyleTag: Property.Object({
    displayName: 'Add Style Tag',
    description:
      'An object representing a style tag to include in the webpage. An object with "url", "path" and "content".',
    required: false,
  }),
  authenticate: Property.Object({
    displayName: 'Authenticate',
    description:
      'Authentication details for the webpage. An object with "username" and "pasword".',
    required: false,
  }),
  viewPort: Property.Object({
    displayName: 'View Port',
    description: 'The viewport settings for the webpage.',
    required: false,
  }),
};

export const captureScreenshot = {
  url: Property.ShortText({
    displayName: 'URL',
    description: 'The URL of the webpage to capture a screenshot of.',
    required: false,
  }),
  html: Property.LongText({
    displayName: 'HTML',
    description: 'The HTML content of the webpage to capture a screenshot of.',
    required: false,
  }),
  optimizeForSpeed: Property.Checkbox({
    displayName: 'Optimize for Speed',
    description: 'Whether to optimize the screenshot for speed.',
    required: false,
  }),
  type: Property.StaticDropdown({
    displayName: 'Screenshot Type',
    description: 'The type of screenshot to capture.',
    required: false,
    options: {
      options: [
        { label: 'JPEG', value: 'jpeg' },
        { label: 'PNG', value: 'png' },
        { label: 'WEBP', value: 'webp' },
      ],
    },
  }),
  fromSurface: Property.Checkbox({
    displayName: 'From Surface',
    description: 'Whether to capture the screenshot from the surface.',
    required: false,
  }),
  fullPage: Property.Checkbox({
    displayName: 'Full Page',
    description: 'Whether to capture a full page screenshot.',
    required: false,
  }),
  omitBackground: Property.Checkbox({
    displayName: 'Omit Background',
    description: 'Whether to omit the background in the screenshot.',
    required: false,
  }),
  path: Property.ShortText({
    displayName: 'Path',
    description: 'The path to save the screenshot.',
    required: false,
  }),
  clip: Property.Object({
    displayName: 'Clip',
    description: 'The clipping region for the screenshot.',
    required: false,
  }),
  encoding: Property.StaticDropdown({
    displayName: 'Encoding',
    description: 'The encoding format for the screenshot.',
    required: false,
    options: {
      options: [
        { label: 'Base64', value: 'base64' },
        { label: 'Binary', value: 'binary' },
      ],
    },
  }),
  captureBeyondViewport: Property.Checkbox({
    displayName: 'Capture Beyond Viewport',
    description: 'Whether to capture beyond the viewport.',
    required: false,
  }),
  ...baseProperties,
};

export const generatePdf = {
  url: Property.ShortText({
    displayName: 'URL',
    description: 'The URL of the webpage to generate a PDF from.',
    required: false,
  }),
  html: Property.LongText({
    displayName: 'HTML',
    description: 'The HTML content of the webpage to generate a PDF from.',
    required: false,
  }),
  scale: Property.Number({
    displayName: 'Scale',
    description:
      'Scales the rendering of the web page. Amount must be between 0.1 and 2.',
    required: false,
  }),
  displayHeaderFooter: Property.Checkbox({
    displayName: 'Display Header/Footer',
    description: 'Whether to show the header and footer.',
    required: false,
  }),
  headerTemplate: Property.LongText({
    displayName: 'Header Template',
    description: 'HTML template for the print header. Should be valid HTML.',
    required: false,
  }),
  footerTemplate: Property.LongText({
    displayName: 'Footer Template',
    description: 'HTML template for the print footer. Should be valid HTML.',
    required: false,
  }),
  printBackground: Property.Checkbox({
    displayName: 'Print Background',
    description: 'Set to true to print background graphics.',
    required: false,
  }),
  landscape: Property.Checkbox({
    displayName: 'Landscape',
    description: 'Whether to print in landscape orientation.',
    required: false,
  }),
  pageRanges: Property.ShortText({
    displayName: 'Page Ranges',
    description: 'Paper ranges to print, e.g. "1-5, 8, 11-13".',
    required: false,
  }),
  format: Property.StaticDropdown({
    displayName: 'Format',
    description: 'All the valid paper format types when printing a PDF.',
    required: false,
    options: {
      options: [
        { label: 'A0', value: 'A0' },
        { label: 'A1', value: 'A1' },
        { label: 'A2', value: 'A2' },
        { label: 'A3', value: 'A3' },
        { label: 'A4', value: 'A4' },
        { label: 'Ledger', value: 'Ledger' },
        { label: 'Legal', value: 'Legal' },
        { label: 'Letter', value: 'Letter' },
        { label: 'Tabloid', value: 'Tabloid' },
      ],
    }
  }),
  width: Property.Number({
    displayName: 'Width',
    description: 'Sets the width of paper.',
    required: false,
  }),
  height: Property.Number({
    displayName: 'Height',
    description: 'Sets the height of paper.',
    required: false,
  }),
  waitForFonts: Property.Checkbox({
    displayName: 'Wait for Fonts',
    description: 'Whether to wait for fonts to be loaded before rendering.',
    required: false,
  }),
  ...baseProperties,
};

export const scrapeUrl = {
  ...baseProperties,
};

export const runBqlQuery = {};

export const getWebsitePerformance = {
  ...baseProperties,
};
