import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

import { simplyprintSession } from '../auth';
import { BASE_URL } from './base-url';
import {
  UploadPart,
  UploadPartResponse,
  UploadUserFileResult,
  simplyprintChunkedUpload,
} from './chunked-upload';

// Native fetch — NOT pieces-common's axios-based httpClient. The httpClient
// does not serialize Web-standard FormData/Blob bodies correctly (axios
// JSON-stringifies them to `{}`), so the previous implementation produced
// empty multipart requests that SimplyPrint rejected with "Validation
// failed … The File is required". Native fetch sets the correct
// Content-Type boundary and streams the body without copying.
function buildSendPart(url: string, headers: Record<string, string>) {
  return async (part: UploadPart): Promise<UploadPartResponse> => {
    const form = new FormData();
    form.append('file', new Blob([part.chunk]), part.filename);
    if (part.kind === 'first') {
      form.append('totalSize', String(part.totalSize));
    } else if (part.kind === 'continue') {
      form.append('continueToken', part.continueToken);
    }

    const res = await fetch(url, { method: 'POST', headers, body: form });
    const text = await res.text();
    let body: Record<string, unknown>;
    try {
      body = text.length > 0 ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      throw new Error(
        `SimplyPrint upload returned non-JSON (HTTP ${res.status}): ${text.slice(0, 500)}`,
      );
    }

    if (!res.ok) {
      throw new Error(
        `SimplyPrint upload failed (HTTP ${res.status}): ${JSON.stringify(body).slice(0, 500)}`,
      );
    }

    const continueToken = body['continueToken'];
    if (typeof continueToken === 'string' && continueToken.length > 0) {
      return { kind: 'continue', continueToken };
    }

    const parsed = simplyprintChunkedUpload.extractFilesApiId(body);
    if (parsed === null) {
      throw new Error(
        `SimplyPrint upload returned no file id and no continueToken (HTTP ${res.status}): ${JSON.stringify(body).slice(0, 500)}`,
      );
    }
    return { kind: 'final', file: parsed, raw: body };
  };
}

async function uploadUserFile(input: UploadUserFileInput): Promise<UploadUserFileResult> {
  if (!input.file) throw new Error('No file provided.');

  const { companyId } = await simplyprintSession.resolveCall(input.auth);
  const headers = simplyprintSession.getAuthHeaders(input.auth);
  const url = `${BASE_URL.files}/${companyId}/files/Upload`;

  return simplyprintChunkedUpload.driveChunkedUpload({
    filename: input.file.filename,
    data: input.file.data,
    sendPart: buildSendPart(url, headers),
  });
}

// Streams the source HTTPS URL into the chunked upload directly — peak RAM
// stays at ~2 * chunkSize regardless of source size. Requires the source URL
// to return Content-Length on the GET (S3 pre-signed URLs / Dropbox raw
// links / etc.) — SimplyPrint's chunked protocol needs `totalSize` declared
// upfront on the first part.
async function uploadUserFileFromUrl(
  input: UploadUserFileFromUrlInput,
): Promise<UploadUserFileResult> {
  if (!input.url) throw new Error('No URL provided.');
  if (!input.filename) throw new Error('No filename provided.');

  // SSRF guard: reject non-HTTPS schemes so a flow can't trick the worker
  // into fetching cloud-instance-metadata (http://169.254.169.254/...),
  // internal-network endpoints, file://, or data:// URIs and forwarding the
  // body to SimplyPrint. https-only is a coarse but effective filter for the
  // shared-AP-instance threat model.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.url);
  } catch {
    throw new Error(`Invalid URL: "${input.url}".`);
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error(
      `URL must use the https:// scheme (got "${parsedUrl.protocol}"). Other schemes are blocked to prevent fetching internal or local resources.`,
    );
  }

  // `redirect: 'error'` so an HTTPS URL that 301s to http://169.254.169.254/
  // (or any other internal endpoint) can't bypass the scheme guard above —
  // fetch follows redirects by default without re-validating the destination.
  const fetchRes = await fetch(input.url, { redirect: 'error' });
  if (!fetchRes.ok) {
    const peek = await fetchRes.text().catch(() => '<no body>');
    throw new Error(
      `Could not fetch file URL (HTTP ${fetchRes.status} ${fetchRes.statusText}): ${peek.slice(0, 300)}`,
    );
  }

  const contentLengthHeader = fetchRes.headers.get('content-length');
  if (!contentLengthHeader) {
    throw new Error(
      `File URL did not return a Content-Length header — SimplyPrint's chunked upload needs the total size upfront. Use a host that sends Content-Length (S3 pre-signed URLs, Dropbox raw links, etc.), or use the "File" input instead (buffered).`,
    );
  }
  const totalSize = parseInt(contentLengthHeader, 10);
  if (!Number.isFinite(totalSize) || totalSize <= 0) {
    throw new Error(`Invalid Content-Length "${contentLengthHeader}" — expected a positive integer.`);
  }

  if (!fetchRes.body) {
    throw new Error('Fetch returned no body stream — cannot stream upload.');
  }

  const { companyId } = await simplyprintSession.resolveCall(input.auth);
  const headers = simplyprintSession.getAuthHeaders(input.auth);
  const url = `${BASE_URL.files}/${companyId}/files/Upload`;

  return simplyprintChunkedUpload.driveStreamedUpload({
    filename: input.filename,
    totalSize,
    source: fetchRes.body as unknown as AsyncIterable<Uint8Array>,
    sendPart: buildSendPart(url, headers),
  });
}

// Returns null for signed URLs / opaque endpoints where the path isn't a
// meaningful filename (caller should require the user to supply one).
function filenameFromUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const last = u.pathname.split('/').filter((s) => s.length > 0).pop();
    if (last && last.includes('.')) {
      return decodeURIComponent(last);
    }
  } catch {
    // fall through
  }
  return null;
}

export const simplyprintFiles = {
  uploadUserFile,
  uploadUserFileFromUrl,
  filenameFromUrl,
};

export type { UploadUserFileResult } from './chunked-upload';

export interface UploadUserFileInput {
  auth: OAuth2PropertyValue;
  file: { filename: string; data: Buffer | Uint8Array };
}

export interface UploadUserFileFromUrlInput {
  auth: OAuth2PropertyValue;
  url: string;
  filename: string;
}
