/**
 * The JSON envelope FileToPDF returns when the request sends `Accept: application/json`.
 */
export interface PdfJsonEnvelope {
  status: string;
  data?: {
    pdf?: string;
    filename?: string;
    pages?: number;
    size_bytes?: number;
    credits_used?: number;
    credits_remaining?: number;
  };
}

/** Minimal shape of the Activepieces files service (context.files). */
export interface FilesService {
  write(input: { fileName: string; data: Buffer }): Promise<string>;
}

/** The output every conversion action returns. */
export interface ConversionOutput {
  file: string;
  filename: string;
  pages: number | undefined;
  fileSize: number | undefined;
  creditsUsed: number | undefined;
  creditsRemaining: number | undefined;
}

/**
 * Coerce option values to the strings the API/Gotenberg expects. The backend's
 * form handling chokes on raw booleans/numbers, so booleans become "true"/"false"
 * and numbers become their string form. Empty/null/undefined values are dropped.
 * (`false` and `0` are kept — only empty strings and null/undefined are removed.)
 */
export function stringifyOptions(
  options: Record<string, unknown> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(options || {})) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
}

/**
 * Decode a base64 PDF envelope and write it as a real Activepieces file so
 * downstream steps (Google Drive, Dropbox, Email…) can consume it. Returns the
 * file reference plus friendly metadata. Mirrors the Zapier/Pipedream output shape.
 */
export async function buildConversionOutput(
  files: FilesService,
  envelope: PdfJsonEnvelope
): Promise<ConversionOutput> {
  const data = envelope && envelope.data;
  if (!data || !data.pdf) {
    throw new Error('The FileToPDF API response did not contain a PDF.');
  }
  const filename = data.filename || 'converted.pdf';
  const buffer = Buffer.from(data.pdf, 'base64');
  const file = await files.write({ fileName: filename, data: buffer });
  return {
    file,
    filename,
    pages: data.pages,
    fileSize: data.size_bytes,
    creditsUsed: data.credits_used,
    creditsRemaining: data.credits_remaining,
  };
}
