import { Property } from '@activepieces/pieces-framework';

/**
 * PDF/A archival conformance levels. Empty selection = no PDF/A (the default).
 */
const PDFA_DROPDOWN = Property.StaticDropdown({
  displayName: 'PDF/A Archival Format',
  description: 'Produce an ISO-standardised archival PDF.',
  required: false,
  options: {
    options: [
      { label: 'PDF/A-1b', value: 'PDF/A-1b' },
      { label: 'PDF/A-2b', value: 'PDF/A-2b' },
      { label: 'PDF/A-3b', value: 'PDF/A-3b' },
    ],
  },
});

/**
 * Layout/Chromium option properties shared by Convert HTML and Convert Markdown.
 * Labels and help mirror the Make app, n8n node, and Zapier app verbatim so every
 * FileToPDF integration reads the same. These conversion parameters require Pro,
 * Scale, or the free trial — on Starter/Basic the API returns 402 upgrade_required.
 */
export const CHROMIUM_OPTION_PROPS = {
  landscape: Property.Checkbox({ displayName: 'Landscape Orientation', required: false }),
  paperWidth: Property.Number({
    displayName: 'Paper Width (Inches)',
    description: 'Default 8.5 (Letter). A4 is 8.27.',
    required: false,
  }),
  paperHeight: Property.Number({
    displayName: 'Paper Height (Inches)',
    description: 'Default 11 (Letter). A4 is 11.7.',
    required: false,
  }),
  marginTop: Property.Number({ displayName: 'Margin Top (Inches)', required: false }),
  marginBottom: Property.Number({ displayName: 'Margin Bottom (Inches)', required: false }),
  marginLeft: Property.Number({ displayName: 'Margin Left (Inches)', required: false }),
  marginRight: Property.Number({ displayName: 'Margin Right (Inches)', required: false }),
  scale: Property.Number({
    displayName: 'Scale',
    description: 'Render scale, e.g. 0.8 to shrink content. Default 1.',
    required: false,
  }),
  printBackground: Property.Checkbox({ displayName: 'Print Background Graphics', required: false }),
  preferCssPageSize: Property.Checkbox({ displayName: 'Prefer CSS @page Size', required: false }),
  nativePageRanges: Property.ShortText({
    displayName: 'Page Ranges',
    description: 'Limit output to specific pages, e.g. "1-3" or "2,5-7".',
    required: false,
  }),
  pdfa: PDFA_DROPDOWN,
  pdfua: Property.Checkbox({ displayName: 'PDF/UA (Accessibility)', required: false }),
  userPassword: Property.ShortText({
    displayName: 'Output Open Password',
    description: 'Encrypt the resulting PDF; this password is required to open it.',
    required: false,
  }),
  ownerPassword: Property.ShortText({
    displayName: 'Output Permissions Password',
    description: 'Restrict editing/printing of the resulting PDF.',
    required: false,
  }),
};

/**
 * Advanced option properties for Convert a File (LibreOffice/passthrough variant).
 * No paper size / margins / scale — those are Chromium-only and ignored by the
 * document/image converters. Matches the n8n node and Zapier app's file option list.
 */
export const FILE_OPTION_PROPS = {
  landscape: Property.Checkbox({ displayName: 'Landscape Orientation', required: false }),
  nativePageRanges: Property.ShortText({
    displayName: 'Page Ranges',
    description: 'Limit output to specific pages, e.g. "1-3" or "2,5-7".',
    required: false,
  }),
  pdfa: PDFA_DROPDOWN,
  pdfua: Property.Checkbox({ displayName: 'PDF/UA (Accessibility)', required: false }),
  password: Property.ShortText({
    displayName: 'Source Document Password',
    description: 'Password to open a protected source document (office files only).',
    required: false,
  }),
  userPassword: Property.ShortText({
    displayName: 'Output Open Password',
    description: 'Encrypt the resulting PDF; this password is required to open it.',
    required: false,
  }),
  ownerPassword: Property.ShortText({
    displayName: 'Output Permissions Password',
    description: 'Restrict editing/printing of the resulting PDF.',
    required: false,
  }),
};
