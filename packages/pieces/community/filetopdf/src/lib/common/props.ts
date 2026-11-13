import { Property } from '@activepieces/pieces-framework';

const pdfa = Property.StaticDropdown({
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

const chromiumOptions = {
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
  pdfa,
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

const fileOptions = {
  landscape: Property.Checkbox({ displayName: 'Landscape Orientation', required: false }),
  nativePageRanges: Property.ShortText({
    displayName: 'Page Ranges',
    description: 'Limit output to specific pages, e.g. "1-3" or "2,5-7".',
    required: false,
  }),
  pdfa,
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

export const filetopdfProps = { chromiumOptions, fileOptions };
