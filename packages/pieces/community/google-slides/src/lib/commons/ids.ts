import { randomUUID } from 'crypto';

function tryParseUrl(input: string): URL | null {
  if (!/^https?:\/\//i.test(input)) {
    return null;
  }
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function isDriveId(value: string | null): value is string {
  return value !== null && DRIVE_ID.test(value) && value.length >= 10;
}

function idFromSlidesUrl(url: URL): string | null {
  if (url.hostname.toLowerCase() !== 'docs.google.com') {
    return null;
  }
  if (PUBLISHED_PATH.test(url.pathname)) {
    throw new Error(
      'This is a "Publish to the web" link, which the Slides API cannot open. Use the presentation\'s edit URL instead.'
    );
  }
  return url.pathname.match(SLIDES_PATH)?.[1] ?? null;
}

function idFromDriveUrl(url: URL): string | null {
  if (url.hostname.toLowerCase() !== 'drive.google.com') {
    return null;
  }
  const fromPath = url.pathname.match(DRIVE_FILE_PATH)?.[1] ?? null;
  if (fromPath) {
    return fromPath;
  }
  const fromQuery = url.searchParams.get('id');
  return url.pathname === '/open' && isDriveId(fromQuery) ? fromQuery : null;
}

function parsePresentationId(input: unknown): string {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) {
    throw new Error('Presentation is required: paste the presentation ID or its URL.');
  }
  const url = tryParseUrl(value);
  if (!url) {
    if (isDriveId(value)) {
      return value;
    }
    throw new Error(
      `"${value}" is not a valid presentation ID or URL. Use the ID between /d/ and /edit in the presentation URL, or paste the whole URL.`
    );
  }
  const id = idFromSlidesUrl(url) ?? idFromDriveUrl(url);
  if (!id) {
    throw new Error(
      `"${value}" is not a Google Slides URL. Expected https://docs.google.com/presentation/d/<id>/edit.`
    );
  }
  return id;
}

function parseObjectId(input: unknown): string {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) {
    throw new Error('Slide object ID is empty.');
  }
  const url = tryParseUrl(value);
  if (url) {
    const match = url.hash.match(SLIDE_HASH);
    if (match && url.hostname.toLowerCase() === 'docs.google.com') {
      return match[1];
    }
    throw new Error(
      'The URL has no slide reference. Select the slide in Google Slides and copy the URL (it ends in #slide=id.<objectId>), or paste the object ID.'
    );
  }
  if (!OBJECT_ID.test(value)) {
    throw new Error(`"${value}" is not a valid object ID (letters, digits, "_", "-" and ":" only).`);
  }
  return value;
}

function parseFolderId(input: unknown): string | undefined {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) {
    return undefined;
  }
  const url = tryParseUrl(value);
  if (!url) {
    if (DRIVE_ID.test(value)) {
      return value;
    }
    throw new Error(`Folder "${value}" is not a valid Drive folder ID or URL.`);
  }
  const match = url.pathname.match(DRIVE_FOLDER_PATH);
  if (url.hostname.toLowerCase() === 'drive.google.com' && match) {
    return match[1];
  }
  throw new Error(
    `Folder: "${value}" is not a Drive folder URL. Expected https://drive.google.com/drive/folders/<id>.`
  );
}

function generateObjectId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

function validateImageUrl(input: unknown): string {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!tryParseUrl(value)) {
    throw new Error(
      'Image URL must be a public http(s) URL to a PNG, JPEG or GIF image, e.g. https://example.com/logo.png.'
    );
  }
  if (value.length > MAX_IMAGE_URL_LENGTH) {
    throw new Error('Image URL is longer than the 2 KB Google allows.');
  }
  return value;
}

const DRIVE_ID = /^[A-Za-z0-9_-]+$/;
const OBJECT_ID = /^[A-Za-z0-9_:-]+$/;
const SLIDES_PATH = /^\/presentation\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{10,})(?:\/|$)/;
const PUBLISHED_PATH = /^\/presentation\/(?:u\/\d+\/)?d\/e\//;
const DRIVE_FILE_PATH = /^\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{10,})(?:\/|$)/;
const DRIVE_FOLDER_PATH = /^\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/;
const SLIDE_HASH = /^#slide=id\.([A-Za-z0-9_:-]+)$/;
const MAX_IMAGE_URL_LENGTH = 2048;

export const slidesIds = {
  parsePresentationId,
  parseObjectId,
  parseFolderId,
  generateObjectId,
  validateImageUrl,
};
