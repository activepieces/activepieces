import { Readable } from 'stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroDownloadInvoicePdf = createAction({
  auth: xeroAuth,
  name: 'xero_download_invoice_pdf',
  classification: 'READ',
  displayName: 'Download Invoice PDF',
  description: 'Downloads the PDF of an invoice or bill so you can attach or send it in later steps.',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads the Xero-rendered PDF of one invoice or bill by InvoiceID and stores it as a file for later steps (email attachment, cloud storage). Use Get Invoice for the invoice data itself. Read-only and idempotent: repeating the call returns the same document.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.invoicePdf,
  props: {
    tenant_id: props.tenant_id,
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The Xero InvoiceID (a GUID). Use Search Invoices or Get Invoice to find it.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Defaults to invoice-<InvoiceID>.pdf.',
      required: false,
    }),
  },
  async run(context) {
    const invoiceId = xeroInput.requiredText({ value: context.propsValue.invoice_id, field: 'Invoice ID' });
    const stream = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Invoices/${encodeURIComponent(invoiceId)}`,
      headers: { Accept: 'application/pdf' },
      responseType: 'stream',
      timeout: DOWNLOAD_TIMEOUT_MS,
      operation: 'download invoice PDF',
    });
    const data = await readCapped({ stream, maxBytes: MAX_PDF_BYTES, timeoutMs: DOWNLOAD_TIMEOUT_MS });
    const requestedName = xeroInput.trimmedOrUndefined({ value: context.propsValue.file_name });
    const baseName = requestedName ?? `invoice-${invoiceId}`;
    const fileName = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`;
    const file = await context.files.write({ fileName, data });
    return { file, fileName, size: data.length, invoiceId: invoiceId };
  },
});

async function readCapped({ stream, maxBytes, timeoutMs }: { stream: unknown; maxBytes: number; timeoutMs: number }): Promise<Buffer> {
  if (!(stream instanceof Readable)) throw new Error('Xero did not return a PDF stream.');
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => stream.destroy(new Error(`Downloading the invoice PDF took longer than ${timeoutMs / 1000} seconds.`)), timeoutMs);
    stream.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) {
        stream.destroy(new Error(`The invoice PDF is larger than ${maxBytes / (1024 * 1024)} MB.`));
        return;
      }
      chunks.push(buffer);
    });
    stream.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    stream.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
  });
}

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 120000;
