import { HttpMethod } from '@activepieces/pieces-common';
import { ApFile, FilesService } from '@activepieces/pieces-framework';
import { whatsscaleClient } from './client';

export async function prepareMediaFile({
  apiKey,
  file,
  files,
  mediaType,
}: PrepareMediaFileParams): Promise<string> {
  const fileUrl = await files.write({
    fileName: file.filename,
    data: file.data,
  });
  assertVendorCanReach(fileUrl);
  const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/make/prepareFile', {
    fileUrl,
    mediaType,
  });
  return (response.body as { url: string }).url;
}

function isUnreachableHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  if (!host.includes('.') && !host.includes(':')) {
    return true;
  }
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 127 ||
    a === 10 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function assertVendorCanReach(fileUrl: string): void {
  let hostname: string;
  try {
    hostname = new URL(fileUrl).hostname;
  } catch {
    return;
  }
  if (!isUnreachableHost(hostname)) {
    return;
  }
  throw new Error(
    `WhatsScale downloads the file from a URL this instance hands it, and that URL points at "${hostname}", which is not reachable from the internet. Media sends need AP_FRONTEND_URL set to a publicly reachable address (a tunnel works). Without it WhatsScale answers "Invalid or blocked media URL".`
  );
}

export type WhatsscaleMediaType = 'image' | 'video' | 'document' | 'audio';

export type PrepareMediaFileParams = {
  apiKey: string;
  file: ApFile;
  files: FilesService;
  mediaType: WhatsscaleMediaType;
};
