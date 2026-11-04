import type { FilesService } from '@activepieces/pieces-framework';
import type { FiletopdfConversionOutput, FiletopdfPdfEnvelope } from './types';

function stringifyOptions(options: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(options || {})) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
}

async function buildConversionOutput({
  files,
  envelope,
}: {
  files: FilesService;
  envelope: FiletopdfPdfEnvelope;
}): Promise<FiletopdfConversionOutput> {
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

export const filetopdfUtils = { stringifyOptions, buildConversionOutput };
