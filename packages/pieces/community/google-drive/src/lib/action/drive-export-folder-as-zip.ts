import {
  createAction,
  Property,
  PieceAuth,
  MarkdownVariant,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Readable } from 'node:stream';
import { ZipWriter, ZipWriterAddDataOptions } from '@zip.js/zip.js';
import { extension } from 'mime-types';
import querystring from 'querystring';
import { googleDriveAuth, GoogleDriveAuthValue, getAccessToken } from '../auth';
import { common } from '../common';

// A zip is a sequential format. Only the entry holding the writer lock streams straight into the
// archive -- that one is paced by backpressure and costs almost nothing. Every *other* in-flight
// add() compresses into a temporary stream zip.js creates with an unbounded high water mark, so
// it is read as fast as the network delivers and held whole until its turn comes. Peak memory
// therefore tracks the bytes waiting behind the lock, not the size of the output.
//
// So the thing that has to be bounded is bytes in flight, not the number of downloads. Batches
// are capped by both: enough small files overlap to hide Drive's per-request latency, while a
// large file ends up alone in its batch and streams through the cheap direct-write path.
// Measured on zip.js 2.8.29 with a 320 MB folder: 5 at a time peaked around 320 MB, 2 at a time
// around 140 MB, one at a time around 34 MB and flat as the folder grows.
const DOWNLOAD_CONCURRENCY = 4;
const MAX_IN_FLIGHT_BYTES = 16 * 1024 * 1024;

// Native Google files are generated at export time, so Drive reports no size for them until the
// export runs. They are typically small, but the estimate is deliberately generous: guessing too
// high only costs a little parallelism, guessing too low costs worker memory.
const UNKNOWN_SIZE_ESTIMATE = 8 * 1024 * 1024;

// Cap on how many validation problems are spelled out in the thrown error. The total count is
// always reported; this only bounds the itemised list.
const MAX_REPORTED_ERRORS = 20;

const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

interface NativeFormatChoice {
  docs: 'skip' | 'pdf' | 'docx';
  sheets: 'skip' | 'pdf' | 'xlsx';
  slides: 'skip' | 'pdf' | 'pptx';
}

interface NativeTypeConfig {
  key: keyof NativeFormatChoice;
  exportMimeTypes: Record<string, string>;
}

const NATIVE_TYPES: Record<string, NativeTypeConfig> = {
  'application/vnd.google-apps.document': {
    key: 'docs',
    exportMimeTypes: {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  },
  'application/vnd.google-apps.spreadsheet': {
    key: 'sheets',
    exportMimeTypes: {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  },
  'application/vnd.google-apps.presentation': {
    key: 'slides',
    exportMimeTypes: {
      pdf: 'application/pdf',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
  },
};

const encryptionMethodDescription = `
- ZipCrypto: Legacy encryption method with wide compatibility (not recommended for sensitive data)
- AES-256: Modern encryption with strong security (may not be supported by older zip clients)
`;

interface ZipFolderEntry {
  relativePath: string;
  fileId: string;
  isEmptyFolder: boolean;
  downloadUrl?: string;
  sizeBytes: number;
}

interface DriveListItem {
  id: string;
  name: string;
  mimeType: string;
  // Drive returns this as a string, and omits it entirely for native Google files (which have
  // no stored bytes until an export generates them) and for folders.
  size?: string;
}

async function listFolderChildren({
  auth,
  folderId,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  folderId: string;
  includeTeamDrives: boolean;
}): Promise<DriveListItem[]> {
  const accessToken = await getAccessToken(auth);
  const items: DriveListItem[] = [];

  const params: Record<string, string> = {
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'nextPageToken,files(id,name,mimeType,size)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
    corpora: includeTeamDrives ? 'allDrives' : 'user',
    pageSize: '1000',
  };

  let nextPageToken: string | undefined;
  do {
    if (nextPageToken) {
      params.pageToken = nextPageToken;
    }
    const response = await httpClient.sendRequest<{
      files: DriveListItem[];
      nextPageToken?: string;
    }>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(
        params
      )}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    items.push(...(response.body.files ?? []));
    nextPageToken = response.body.nextPageToken;
  } while (nextPageToken);

  return items;
}

interface ExportError {
  name: string;
  location: string;
  message: string;
}

// Drive allows '/', '\' and '..' in item names (confirmed in the web UI). None of that can be
// normalized away without changing the directory structure or the file's actual name, so an
// unsafe name is rejected outright instead. Returns a description of the problem rather than
// throwing, so callers can collect every error across the whole tree into one final error
// instead of failing on the first one found.
function checkSafeItemName(
  name: string,
  relativePrefix: string
): ExportError | undefined {
  const location = relativePrefix.length > 0 ? relativePrefix : '/';
  const quotedName = `"${name}"`;

  // '/' is the zip path separator itself, so a name containing one spans levels it has no
  // business spanning -- it bypasses the sibling collision check above (which only compares
  // names within one level) and fabricates directories that don't exist in Drive.
  if (name.includes('/')) {
    return { name: quotedName, location, message: 'contains "/"' };
  }

  // Not the zip separator, but some extraction tools (Windows-based ones especially) treat it
  // as one -- same class of ambiguity as '/', rejected for the same reason.
  if (name.includes('\\')) {
    return { name: quotedName, location, message: 'contains "\\"' };
  }

  // Escapes the archive root entirely on extraction (zip-slip). Only reachable once '/' and '\'
  // are ruled out above -- with those banned, a single Drive item name can never represent more
  // than one path segment, so this must be an exact match rather than a substring search (a
  // substring search would also reject a legitimate name like "my..file.pdf", which contains
  // ".." but isn't the traversal segment ".." itself).
  if (name === '..') {
    return { name: quotedName, location, message: 'escapes the archive root on extraction' };
  }

  // A "current directory" segment is normalized away by most unzip tools, so a folder named "."
  // containing "x.pdf" extracts to the same path as a real sibling "x.pdf" -- same collision
  // this check exists to prevent for '/', just camouflaged by a name that looks like a no-op
  // instead of an extra path segment.
  if (name === '.') {
    return { name: quotedName, location, message: 'collides with other paths once normalized on extraction' };
  }

  return undefined;
}

interface ResolvedItem {
  item: DriveListItem;
  name: string;
  downloadUrl?: string;
}

// The name and download URL this item would occupy in the zip, or undefined if it produces no
// entry at all (a skipped native file, or an unsupported Google Workspace type). Folders have
// no downloadUrl -- walk() recurses into them instead of adding an entry directly.
function resolveItem(
  item: DriveListItem,
  nativeFormats: NativeFormatChoice
): ResolvedItem | undefined {
  if (item.mimeType === GOOGLE_FOLDER_MIME_TYPE) {
    return { item, name: item.name };
  }

  const nativeType = NATIVE_TYPES[item.mimeType];
  if (nativeType) {
    const format = nativeFormats[nativeType.key];
    if (format === 'skip') {
      return undefined;
    }
    const exportMimeType = nativeType.exportMimeTypes[format];
    const fileExtension = extension(exportMimeType);
    return {
      item,
      name: fileExtension ? `${item.name}.${fileExtension}` : item.name,
      downloadUrl: `https://www.googleapis.com/drive/v3/files/${
        item.id
      }/export?mimeType=${encodeURIComponent(
        exportMimeType
      )}&supportsAllDrives=true`,
    };
  }

  if (item.mimeType.startsWith('application/vnd.google-apps.')) {
    return undefined;
  }

  return {
    item,
    name: item.name,
    downloadUrl: `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media&supportsAllDrives=true`,
  };
}

// A Drive folder and a file (or two folders, or two files) can share a name in the same parent
// -- Drive only guarantees uniqueness by ID. Any such collision would force one zip path to be
// both a file and a directory, so it's checked once per level, up front, before any of these
// children are processed. Each colliding name is its own independent cluster -- a folder full of
// duplicates can have several unrelated ones at the same level (e.g. "Report" appears twice AND,
// separately, "readme.txt" also appears twice), so each gets its own error rather than being
// bundled into one combined line.
// Names are grouped case-insensitively: Drive is case-sensitive, but Windows and the default
// macOS filesystem are not, so "Report.pdf" beside "report.pdf" extracts as one file there and
// the other's content is silently lost. Grouping by the folded name catches that too, and the
// distinct spellings are listed so the user can see which items actually clash.
function checkUniqueNames(
  resolvedChildren: ResolvedItem[],
  relativePrefix: string
): ExportError[] {
  const groups = new Map<string, string[]>();
  for (const { name } of resolvedChildren) {
    const key = name.toLowerCase();
    const group = groups.get(key);
    if (group) {
      group.push(name);
    } else {
      groups.set(key, [name]);
    }
  }

  const location = relativePrefix.length > 0 ? relativePrefix : '/';
  const errors: ExportError[] = [];
  for (const names of groups.values()) {
    if (names.length <= 1) {
      continue;
    }
    const spellings = [...new Set(names)];
    errors.push({
      name: spellings.map((name) => `"${name}"`).join(', '),
      location,
      message:
        spellings.length > 1
          ? `${names.length} items would map to the same zip path (names differing only by case collide on Windows and macOS)`
          : `${names.length} items would map to the same zip path`,
    });
  }
  return errors;
}

async function walk({
  auth,
  folderId,
  relativePrefix,
  nativeFormats,
  includeTeamDrives,
  out,
  errors,
}: {
  auth: GoogleDriveAuthValue;
  folderId: string;
  relativePrefix: string;
  nativeFormats: NativeFormatChoice;
  includeTeamDrives: boolean;
  out: ZipFolderEntry[];
  errors: ExportError[];
}): Promise<void> {
  const children = await listFolderChildren({
    auth,
    folderId,
    includeTeamDrives,
  });

  if (children.length === 0) {
    if (relativePrefix.length > 0) {
      out.push({
        relativePath: relativePrefix,
        fileId: folderId,
        isEmptyFolder: true,
        sizeBytes: 0,
      });
    }
    return;
  }

  const resolvedChildren = children
    .map((item) => resolveItem(item, nativeFormats))
    .filter((resolved): resolved is ResolvedItem => resolved !== undefined);

  // Only validated for items that actually survive into the export -- a skipped native file or
  // an unsupported type (e.g. a Google Form, which is always excluded) never produces a zip
  // entry, so an unsafe character in its name should never fail the export. Errors are collected
  // rather than thrown immediately, so the whole tree is still walked and every error -- not just
  // the first one found -- ends up in the final error.
  for (const { item } of resolvedChildren) {
    const error = checkSafeItemName(item.name, relativePrefix);
    if (error) {
      errors.push(error);
    }
  }
  errors.push(...checkUniqueNames(resolvedChildren, relativePrefix));

  for (const resolved of resolvedChildren) {
    const itemPath =
      relativePrefix.length > 0
        ? `${relativePrefix}/${resolved.name}`
        : resolved.name;

    if (resolved.item.mimeType === GOOGLE_FOLDER_MIME_TYPE) {
      await walk({
        auth,
        folderId: resolved.item.id,
        relativePrefix: itemPath,
        nativeFormats,
        includeTeamDrives,
        out,
        errors,
      });
      continue;
    }

    const reportedSize = Number(resolved.item.size);
    out.push({
      relativePath: itemPath,
      fileId: resolved.item.id,
      isEmptyFolder: false,
      downloadUrl: resolved.downloadUrl,
      sizeBytes: Number.isFinite(reportedSize)
        ? reportedSize
        : UNKNOWN_SIZE_ESTIMATE,
    });
  }
}

async function collectZipEntries({
  auth,
  rootFolderId,
  nativeFormats,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  rootFolderId: string;
  nativeFormats: NativeFormatChoice;
  includeTeamDrives: boolean;
}): Promise<ZipFolderEntry[]> {
  const out: ZipFolderEntry[] = [];
  const errors: ExportError[] = [];
  await walk({
    auth,
    folderId: rootFolderId,
    relativePrefix: '',
    nativeFormats,
    includeTeamDrives,
    out,
    errors,
  });

  // The whole tree is walked before failing, so a folder with several unrelated problems (unsafe
  // names, path collisions) surfaces all of them in one error instead of one fix-and-rerun cycle
  // per error. Sorted by location then name so errors in the same folder read together.
  if (errors.length > 0) {
    const sorted = [...errors].sort(
      (a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name)
    );
    // A folder can produce thousands of these, and the whole message ends up in the run log
    // and the step error panel, so only the first few are listed and the rest are counted.
    const listed = sorted.slice(0, MAX_REPORTED_ERRORS);
    const lines = listed.map(
      (error) => `- [${error.location}] ${error.name} ${error.message}`
    );
    if (sorted.length > listed.length) {
      lines.push(`- ...and ${sorted.length - listed.length} more`);
    }
    throw new Error(
      `Cannot export (${errors.length} problem${
        errors.length > 1 ? 's' : ''
      }) - Rename the conflicting or unsafe items in Drive and try again.\n${lines.join('\n')}`
    );
  }

  return out;
}

// Groups entries into batches that are downloaded concurrently, bounded by both the number of
// requests and the bytes they put in flight. A file bigger than the whole budget still gets its
// own batch rather than being skipped -- alone it holds the writer lock and streams straight
// into the archive, which is the one path zip.js paces with real backpressure.
function batchByBytes(entries: ZipFolderEntry[]): ZipFolderEntry[][] {
  const batches: ZipFolderEntry[][] = [];
  let current: ZipFolderEntry[] = [];
  let currentBytes = 0;

  for (const entry of entries) {
    const wouldExceedBytes = currentBytes + entry.sizeBytes > MAX_IN_FLIGHT_BYTES;
    const wouldExceedCount = current.length >= DOWNLOAD_CONCURRENCY;
    if (current.length > 0 && (wouldExceedBytes || wouldExceedCount)) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(entry);
    currentBytes += entry.sizeBytes;
  }

  if (current.length > 0) {
    batches.push(current);
  }
  return batches;
}

async function downloadAndAddZipEntry({
  auth,
  entry,
  zipWriter,
  fileAddOptions,
}: {
  auth: GoogleDriveAuthValue;
  entry: ZipFolderEntry;
  zipWriter: ZipWriter<unknown>;
  fileAddOptions: ZipWriterAddDataOptions;
}): Promise<void> {
  if (!entry.downloadUrl) {
    throw new Error(`No download URL for entry "${entry.relativePath}"`);
  }
  const accessToken = await getAccessToken(auth);
  const response = await fetch(entry.downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => '');
    if (response.status === 403 && body.includes('exportSizeLimitExceeded')) {
      throw new Error(
        `Export failed for "${entry.relativePath}": exceeds Drive's ~10MB export size limit.`
      );
    }
    throw new Error(
      `Failed to download "${entry.relativePath}" (HTTP ${response.status}): ${body}`
    );
  }
  // stream the response body straight into the zip entry rather than buffering it into a Blob first
  await zipWriter.add(entry.relativePath, response.body, fileAddOptions);
}

export const driveExportFolderAsZip = createAction({
  auth: googleDriveAuth,
  name: 'drive_export_folder_as_zip',
  displayName: 'Export Folder as Zip',
  description:
    'Recursively export a Google Drive folder (with all subfolders) as a single zip file.',
  audience: 'human',
  aiMetadata: {
    description:
      'Recursively downloads every file in a Drive folder (including subfolders) and packages them into a single zip whose internal paths mirror the folder hierarchy. Native Google Docs/Sheets/Slides are converted per user-chosen format (PDF/Office format) or skipped. Fails the whole action if any single file cannot be downloaded/exported. Optionally password-protects the zip.',
    idempotent: true,
  },
  props: {
    duplicatePathWarning: Property.MarkDown({
      value:
        'Zip paths mirror the Drive folder exactly, with no renaming. The action fails before downloading anything if: a file and a folder share a name in the same Drive folder, two items share a name, or a Google Doc/Sheet/Slides export lands on a name that already exists (e.g. a Sheet named "Report" exported as PDF alongside an existing "Report.pdf"); or an included item\'s name contains "/" or "\\", or is exactly "." or ".." (not usable as a zip path segment). Rename the conflicting or unsafe item in Drive and re-run.',
      variant: MarkdownVariant.WARNING,
    }),
    folderId: Property.Dropdown({
      displayName: 'Folder',
      description: 'The Drive folder to export (including all subfolders).',
      required: true,
      auth: googleDriveAuth,
      refreshers: ['includeTeamDrives'],
      refreshOnSearch: true,
      options: async ({ auth, includeTeamDrives }, ctx) =>
        common.fetchFolderDropdownOptions({
          auth: auth as GoogleDriveAuthValue | undefined,
          searchValue: ctx?.searchValue,
          includeTeamDrives: includeTeamDrives as boolean | undefined,
        }),
    }),
    includeTeamDrives: Property.Checkbox({
      displayName: 'Include Team Drives',
      required: false,
      defaultValue: false,
    }),
    googleDocsFormat: Property.StaticDropdown({
      displayName: 'Google Docs',
      description: 'How to include native Google Docs found in the folder.',
      required: true,
      defaultValue: 'docx',
      options: {
        options: [
          { label: 'Word (DOCX)', value: 'docx' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Skip', value: 'skip' },
        ],
      },
    }),
    googleSheetsFormat: Property.StaticDropdown({
      displayName: 'Google Sheets',
      description: 'How to include native Google Sheets found in the folder.',
      required: true,
      defaultValue: 'xlsx',
      options: {
        options: [
          { label: 'Excel (XLSX)', value: 'xlsx' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Skip', value: 'skip' },
        ],
      },
    }),
    googleSlidesFormat: Property.StaticDropdown({
      displayName: 'Google Slides',
      description: 'How to include native Google Slides found in the folder.',
      required: true,
      defaultValue: 'pptx',
      options: {
        options: [
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Skip', value: 'skip' },
        ],
      },
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output Zip File Name',
      required: true,
      defaultValue: 'export.zip',
    }),
    usePassword: Property.Checkbox({
      displayName: 'Use password',
      description: 'Enable password protection for the zip file',
      required: false,
      defaultValue: false,
    }),
    passwordOptions: Property.DynamicProperties({
      displayName: 'Password options',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['usePassword'],
      props: async ({ usePassword }) => {
        if (!usePassword) {
          return {};
        }

        const fields = {
          password: Property.ShortText({
            displayName: 'Password',
            required: true,
          }),
          encryptionMethod: Property.StaticDropdown({
            displayName: 'Encryption Method',
            description: encryptionMethodDescription,
            required: true,
            defaultValue: 'zipcrypto',
            options: {
              disabled: false,
              options: [
                { label: 'ZipCrypto (Most Compatible)', value: 'zipcrypto' },
                { label: 'AES-256 (Stronger Security)', value: 'aes-256' },
              ],
            },
          }),
        };

        return fields;
      },
    }),
  },
  async run(context) {
    const nativeFormats: NativeFormatChoice = {
      docs: context.propsValue.googleDocsFormat as NativeFormatChoice['docs'],
      sheets: context.propsValue
        .googleSheetsFormat as NativeFormatChoice['sheets'],
      slides: context.propsValue
        .googleSlidesFormat as NativeFormatChoice['slides'],
    };

    const entries = await collectZipEntries({
      auth: context.auth,
      rootFolderId: context.propsValue.folderId,
      nativeFormats,
      includeTeamDrives: context.propsValue.includeTeamDrives ?? false,
    });

    // Resolved before the archive stream exists: anything that throws past this point has to
    // tear the upload down by hand, so every input check belongs above it.
    const fileAddOptions: ZipWriterAddDataOptions = {};
    if (context.propsValue.usePassword) {
      const password = context.propsValue.passwordOptions?.[
        'password'
      ] as string;
      const encryptionMethod = context.propsValue.passwordOptions?.[
        'encryptionMethod'
      ] as string;

      // zip.js treats an empty/absent password as "no encryption" and writes the archive in the
      // clear. Failing here is the only safe reading: the user asked for a password, so silently
      // handing back an unencrypted zip is worse than not producing one at all.
      if (!password) {
        throw new Error(
          'Cannot export: "Use password" is enabled but no password was provided. Enter a password or turn the option off.'
        );
      }

      fileAddOptions.password = password;

      switch (encryptionMethod) {
        case 'aes-256':
          fileAddOptions.encryptionStrength = 3;
          break;
        case 'zipcrypto':
        default:
          fileAddOptions.zipCrypto = true;
          break;
      }
    }

    const zipStream = new TransformStream();
    const zipWriter = new ZipWriter(zipStream.writable);
    // @ts-expect-error -- undici streams a Node web ReadableStream; the DOM fetch types omit the fromWeb overload
    const zipReadable: Readable = Readable.fromWeb(zipStream.readable);

    // start consuming the zip output as it's produced, rather than waiting for the whole
    // archive to be built in memory before writing it out
    const writeFilePromise = context.files.write({
      data: zipReadable,
      fileName: context.propsValue.outputFileName,
    });
    // if the produce side below throws, the stream gets aborted and this promise settles on its
    // own -- observe it here so that doesn't surface as an unhandled rejection; the real outcome
    // is still surfaced via `return writeFilePromise` on the success path below
    writeFilePromise.catch(() => undefined);

    const fileEntries: ZipFolderEntry[] = [];
    const emptyFolderEntries: ZipFolderEntry[] = [];
    for (const entry of entries) {
      (entry.isEmptyFolder ? emptyFolderEntries : fileEntries).push(entry);
    }

    try {
      for (const batch of batchByBytes(fileEntries)) {
        // zip.js supports adding multiple entries concurrently (see its own "Adding concurrently
        // multiple entries" example). Only the entry holding the writer lock streams straight
        // into the archive; the others are buffered until their turn, which is why the batch is
        // bounded by bytes rather than by count alone.
        await Promise.all(
          batch.map((entry) =>
            downloadAndAddZipEntry({
              auth: context.auth,
              entry,
              zipWriter,
              fileAddOptions,
            })
          )
        );
      }

      for (const folder of emptyFolderEntries) {
        await zipWriter.add(`${folder.relativePath}/`, undefined, {
          directory: true,
        });
      }

      await zipWriter.close();
    } catch (error) {
      // a download/add failure leaves the file upload waiting on a stream that will never
      // produce more data or end. zipStream.writable.abort() is not reliable here -- zip.js
      // can still hold the native lock on it while other concurrent add() calls in the same
      // batch are mid-write, which makes abort() throw and leaves the upload hanging anyway.
      // Destroying the readable side works regardless of that lock state.
      zipReadable.destroy(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }

    return writeFilePromise;
  },
});
