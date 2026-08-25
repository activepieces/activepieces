export type PolyDocOperation = 'pdf' | 'screenshot' | 'einvoice';
export type PolyDocSourceType = 'url' | 'html' | 'template';
export type PolyDocDeliveryMode = 'download' | 'cloudStorage' | 'webhook';

export type JsonObject = Record<string, unknown>;

export interface PolyDocDelivery {
  mode: PolyDocDeliveryMode;
  presignedUrl?: string;
  webhook?: JsonObject;
}

export interface PolyDocParams {
  operation: PolyDocOperation;
  sourceType: PolyDocSourceType;
  url?: string;
  html?: string;
  templateId?: string;
  templateData?: JsonObject;
  filename?: string;
  tag?: string;
  timeout?: number;
  /** PDF UI options: format, landscape, printBackground, scale, pageRanges, outline, tagged, margin* */
  pdfOptions?: JsonObject;
  /** Screenshot UI options: imageType, fullPage, quality, encoding, viewportWidth, viewportHeight, devicePixelRatio */
  screenshotOptions?: JsonObject;
  eInvoiceStandard?: 'facturx' | 'zugferd';
  eInvoiceProfile?: string;
  eInvoiceVerify?: boolean;
  invoice?: JsonObject;
  /** Raw object deep-merged into the request body for any field not surfaced as a control. */
  advanced?: JsonObject;
  delivery: PolyDocDelivery;
}

export interface PolyDocRequest {
  endpoint: string;
  body: JsonObject;
  isBinary: boolean;
}
