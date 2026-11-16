import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ApFile } from '@activepieces/pieces-framework';

export const INVOICEXML_BASE_URL = 'https://api.invoicexml.com/v1';

type InvoiceFormat = {
  label: string;
  value: string;
  extension: 'xml' | 'pdf';
};

// The five invoice formats. ZUGFeRD and Factur-X are hybrid PDFs with the XML embedded.
export const INVOICE_FORMATS: InvoiceFormat[] = [
  { label: 'XRechnung (XML)', value: 'xrechnung', extension: 'xml' },
  { label: 'ZUGFeRD (PDF)', value: 'zugferd', extension: 'pdf' },
  { label: 'Factur-X (PDF)', value: 'facturx', extension: 'pdf' },
  { label: 'UBL / Peppol BIS (XML)', value: 'ubl', extension: 'xml' },
  { label: 'CII (XML)', value: 'cii', extension: 'xml' },
];

export function formatExtension(format: string): 'xml' | 'pdf' {
  return INVOICE_FORMATS.find((f) => f.value === format)?.extension ?? 'xml';
}

export function formatLabel(format: string): string {
  return INVOICE_FORMATS.find((f) => f.value === format)?.label ?? format;
}

// Every format pair the API converts between, as `<from>/to/<to>` route segments.
const CONVERSIONS: [string, string][] = [
  ['ubl', 'cii'],
  ['cii', 'ubl'],
  ['xrechnung', 'ubl'],
  ['xrechnung', 'cii'],
  ['ubl', 'xrechnung'],
  ['cii', 'xrechnung'],
  ['facturx', 'ubl'],
  ['facturx', 'cii'],
  ['zugferd', 'ubl'],
  ['zugferd', 'cii'],
  ['ubl', 'facturx'],
  ['ubl', 'zugferd'],
  ['cii', 'facturx'],
  ['cii', 'zugferd'],
  ['xrechnung', 'facturx'],
  ['xrechnung', 'zugferd'],
];

export const CONVERSION_OPTIONS = CONVERSIONS.map(([from, to]) => ({
  label: `${formatLabel(from)} to ${formatLabel(to)}`,
  value: `${from}/to/${to}`,
}));

export const PDF_LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'German', value: 'de' },
  { label: 'French', value: 'fr' },
];

// Builds the multipart body the upload endpoints expect: the invoice in the `file` part
// plus any plain form fields.
export function fileForm(
  file: ApFile,
  fields: Record<string, string> = {}
): FormData {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file.data)]), file.filename);
  for (const [name, value] of Object.entries(fields)) {
    form.append(name, value);
  }
  return form;
}

export async function callInvoiceXml<T>(params: {
  apiKey: string;
  path: string;
  body: unknown;
  responseType: 'json' | 'arraybuffer';
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${INVOICEXML_BASE_URL}${params.path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.apiKey,
    },
    body: params.body,
    responseType: params.responseType,
  });
  return response.body;
}

// The file name for a generated document: the input's name with the new extension.
export function outputFileName(
  sourceName: string | undefined,
  fallback: string,
  extension: string
): string {
  const base = sourceName ? sourceName.replace(/\.[^.]+$/, '') : fallback;
  return `${base}.${extension}`;
}
