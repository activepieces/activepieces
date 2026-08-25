import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth, simplyprintSession } from '../auth';
import { BASE_URL } from '../common/base-url';

/**
 * Download a file (user file, queue item, print job file, or temp upload)
 * and return it as an Activepieces file reference plus metadata. Subsequent
 * steps consume the reference via Property.File.
 *
 * Uses native fetch (not the AP/axios httpClient) so the binary stream isn't
 * mis-handled — same reasoning as `common/files.ts::buildSendPart`.
 */
export const downloadFileAction = createAction({
  auth: simplyprintAuth,
  name: 'download_file',
  displayName: 'Download File',
  description:
    'Download a file from SimplyPrint by user-file UID, queue-item ID, or print-job UID. Returns the file as an Activepieces file reference plus content-type / size metadata.',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads a file from SimplyPrint and returns it as a reusable file reference for downstream steps. A "source" mode selects which kind of file the identifier refers to: user-file UID, numeric queue-item ID, or print-job UID. Use after locating the item via "List Files" / "List Queue Items" / "List Print History"; the identifier format must match the chosen source. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    source: Property.StaticDropdown<'userFile' | 'queueItem' | 'printJob'>({
      displayName: 'Source',
      description: 'Which kind of file to fetch.',
      required: true,
      defaultValue: 'userFile',
      options: {
        options: [
          { label: 'User file (UID)', value: 'userFile' },
          { label: 'Queue item (numeric ID)', value: 'queueItem' },
          { label: 'Print job (UID)', value: 'printJob' },
        ],
      },
    }),
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description:
        'UID for "User file" / "Print job", numeric ID for "Queue item". Look these up via "List Files" / "List Print History" / "List Queue Items".',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename override (optional)',
      description: 'Name to store the downloaded file under in AP. Defaults to the Content-Disposition value or the identifier.',
      required: false,
    }),
  },
  async run(context) {
    const { headers, companyId } = await simplyprintSession.resolveCall(context.auth);
    const queryParams = new URLSearchParams({ file: String(context.propsValue.identifier).trim() });
    if (context.propsValue.source === 'queueItem') queryParams.set('isQueue', '1');
    else if (context.propsValue.source === 'printJob') queryParams.set('isPrintFile', '1');

    const url = `${BASE_URL.api}/${companyId}/files/Download?${queryParams.toString()}`;

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const peek = await res.text().catch(() => '<no body>');
      throw new Error(
        `SimplyPrint download failed (HTTP ${res.status} ${res.statusText}): ${peek.slice(0, 500)}`,
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const size = buf.byteLength;

    // Try to derive a filename from Content-Disposition (RFC 6266 — best-effort).
    const cd = res.headers.get('content-disposition') ?? '';
    const cdMatch = /filename\*?=(?:UTF-8'')?["]?([^";]+)["]?/i.exec(cd);
    const derivedName = cdMatch ? decodeURIComponent(cdMatch[1].trim()) : null;
    const finalName =
      (context.propsValue.filename?.trim() && context.propsValue.filename.trim()) ||
      derivedName ||
      String(context.propsValue.identifier).trim();

    const fileRef = await context.files.write({ fileName: finalName, data: buf });

    return {
      file: fileRef,
      filename: finalName,
      contentType,
      size,
    };
  },
});
