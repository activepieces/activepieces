export const DEFAULT_BASE_URL = 'https://api.polydoc.tech';

export const PDF_CONVERT_PATH = '/pdf/convert';
export const SCREENSHOT_CONVERT_PATH = '/screenshot/convert';

export const SOURCE_TYPES = [
  { label: 'URL (render a web page)', value: 'url' },
  { label: 'HTML (render an inline HTML string)', value: 'html' },
  { label: 'Template (render a saved PolyDoc template by ID)', value: 'template' },
] as const;

export const DELIVERY_MODES = [
  { label: 'Download (return the file)', value: 'download' },
  { label: 'Cloud Storage (upload to a presigned URL)', value: 'cloudStorage' },
  { label: 'Webhook (deliver the file to a URL)', value: 'webhook' },
] as const;

export const PAGE_FORMATS = ['A3', 'A4', 'A5', 'Ledger', 'Legal', 'Letter', 'Tabloid'] as const;

export const IMAGE_TYPES = ['png', 'jpeg', 'webp'] as const;

export const SCREENSHOT_OUTPUT_ENCODINGS = [
  { label: 'Binary file (write the image to a file)', value: 'binaryFile' },
  { label: 'Base64 (return the image as a base64 string)', value: 'base64' },
] as const;

export const EINVOICE_STANDARDS = [
  { label: 'ZUGFeRD (Germany / EU)', value: 'zugferd' },
  { label: 'Factur-X (France / EU)', value: 'facturx' },
] as const;

export const EINVOICE_PROFILES = ['minimum', 'basicwl', 'basic', 'en16931', 'extended'] as const;
