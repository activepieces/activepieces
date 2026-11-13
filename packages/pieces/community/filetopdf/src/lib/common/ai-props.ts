import { Property } from '@activepieces/pieces-framework';

function booleanOption({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description: `${description} "true" or "false"; omit to use the default (false).`,
    required: false,
    options: {
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
    },
  });
}

function inches({ displayName, description }: { displayName: string; description: string }) {
  return Property.Number({ displayName, description, required: false });
}

function additionalOptions({ endpointOptions }: { endpointOptions: string }) {
  return Property.Json({
    displayName: 'Additional Options',
    description: `Other FileToPDF conversion parameters as a JSON object of name to value, e.g. {"metadata": {"Title": "Report"}}. Supported here: ${endpointOptions}. The fields above win over the same name here.`,
    required: false,
  });
}

const sharedOptions = {
  landscape: booleanOption({
    displayName: 'Landscape Orientation',
    description: 'Rotate the output to landscape.',
  }),
  nativePageRanges: Property.ShortText({
    displayName: 'Page Ranges',
    description: 'Pages to keep, counted from 1, e.g. "1-3" or "1,3,5-7". Omit for all pages.',
    required: false,
  }),
  pdfa: Property.StaticDropdown({
    displayName: 'PDF/A Archival Format',
    description:
      'Produce an archival PDF: "PDF/A-1b", "PDF/A-2b" or "PDF/A-3b". Cannot be combined with userPassword or ownerPassword.',
    required: false,
    options: {
      options: [
        { label: 'PDF/A-1b', value: 'PDF/A-1b' },
        { label: 'PDF/A-2b', value: 'PDF/A-2b' },
        { label: 'PDF/A-3b', value: 'PDF/A-3b' },
      ],
    },
  }),
  pdfua: booleanOption({
    displayName: 'PDF/UA (Accessibility)',
    description: 'Apply PDF/UA accessibility post-processing.',
  }),
  userPassword: Property.ShortText({
    displayName: 'Output Open Password',
    description: 'Encrypt the PDF so this password is needed to open it. Cannot be combined with pdfa.',
    required: false,
  }),
  ownerPassword: Property.ShortText({
    displayName: 'Output Permissions Password',
    description: 'Password that controls printing, copying and editing of the PDF.',
    required: false,
  }),
};

const chromiumOptions = {
  ...sharedOptions,
  paperWidth: inches({
    displayName: 'Paper Width (Inches)',
    description: 'Page width in inches. Defaults to 8.5 (US Letter); A4 is 8.27.',
  }),
  paperHeight: inches({
    displayName: 'Paper Height (Inches)',
    description: 'Page height in inches. Defaults to 11 (US Letter); A4 is 11.69.',
  }),
  marginTop: inches({ displayName: 'Margin Top (Inches)', description: 'Defaults to 0.39 (about 1 cm).' }),
  marginBottom: inches({ displayName: 'Margin Bottom (Inches)', description: 'Defaults to 0.39 (about 1 cm).' }),
  marginLeft: inches({ displayName: 'Margin Left (Inches)', description: 'Defaults to 0.39 (about 1 cm).' }),
  marginRight: inches({ displayName: 'Margin Right (Inches)', description: 'Defaults to 0.39 (about 1 cm).' }),
  scale: Property.Number({
    displayName: 'Scale',
    description: 'Content scale from 0.1 to 2. Defaults to 1; below 1 shrinks the content.',
    required: false,
  }),
  printBackground: booleanOption({
    displayName: 'Print Background Graphics',
    description: 'Keep CSS background colors and images.',
  }),
  preferCssPageSize: booleanOption({
    displayName: 'Prefer CSS @page Size',
    description: 'Take the page size from the CSS @page rule instead of paperWidth and paperHeight.',
  }),
  additionalOptions: additionalOptions({
    endpointOptions:
      'waitDelay ("500ms", max "15s"), waitForSelector, waitForExpression, emulatedMediaType ("print" or "screen"), emulatedMediaFeatures, singlePage, omitBackground, generateDocumentOutline, generateTaggedPdf, flatten, metadata (Author, Title, Subject, Keywords, Creator, Producer, CreationDate, ModDate), skipNetworkIdleEvent, failOnConsoleExceptions, failOnResourceHttpStatusCodes, extraHttpHeaders, userAgent',
  }),
};

const fileOptions = {
  ...sharedOptions,
  nativePageRanges: Property.ShortText({
    displayName: 'Page Ranges',
    description:
      'Pages to keep, counted from 1, always written as ranges: "1-1" for page 1 alone, "1-3" for pages 1 to 3. A bare "1" is ignored and every page is kept. Omit for all pages.',
    required: false,
  }),
  password: Property.ShortText({
    displayName: 'Source Document Password',
    description: 'Password that opens a protected source document (Office files only).',
    required: false,
  }),
  additionalOptions: additionalOptions({
    endpointOptions:
      'nativeWatermarkText, quality (1-100), losslessImageCompression, reduceImageResolution, maxImageResolution (DPI), flatten, metadata (Author, Title, Subject, Keywords, Creator, Producer, CreationDate, ModDate), singlePageSheets, exportFormFields, exportNotes, exportNotesPages, exportHiddenSlides, skipEmptyPages, addOriginalDocumentAsStream, displayPDFDocumentTitle',
  }),
};

export const filetopdfAiProps = { chromiumOptions, fileOptions };
