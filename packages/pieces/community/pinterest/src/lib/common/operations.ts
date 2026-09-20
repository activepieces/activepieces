import { HttpMethod } from '@activepieces/pieces-common';
import { buildPath, isRecord, makeRequest } from '.';

type CreatePinParams = {
  accessToken: string;
  board_id: string;
  title: string;
  media_source_type: string;
  media_url: string;
  board_section_id?: string;
  description?: string;
  link?: string;
  dominant_color?: string;
  alt_text?: string;
  parent_pin_id?: string;
  note?: string;
  sponsor_id?: string;
  is_removable?: boolean;
  product_tags?: string[];
  ad_account_id?: string;
};

type CreateBoardParams = {
  accessToken: string;
  name: string;
  description?: string;
  privacy?: string;
  is_ads_only?: boolean;
  ad_account_id?: string;
};

type UpdateBoardParams = {
  accessToken: string;
  board_id: string;
  name?: string;
  description?: string;
  privacy?: string;
  ad_account_id?: string;
};

type DeletePinParams = {
  accessToken: string;
  pin_id: string;
  ad_account_id?: string;
};

type SearchPinsResult = {
  items: unknown[];
  bookmark: string | undefined | null;
  total_results: number;
  query_used: string;
  has_more: boolean;
};

type SearchParams = {
  accessToken: string;
  query: string;
  bookmark?: string;
  ad_account_id?: string;
};

function assertMaxLength({
  value,
  max,
  label,
}: {
  value: string | undefined;
  max: number;
  label: string;
}) {
  if (value !== undefined && value.length > max) {
    throw new Error(`${label} must be ${max} characters or less`);
  }
}

function assertUrl({
  value,
  label,
}: {
  value: string | undefined;
  label: string;
}) {
  if (value === undefined) {
    return;
  }
  try {
    new URL(value);
  } catch {
    throw new Error(`Please enter a valid URL for ${label}`);
  }
}

async function createPinOperation(params: CreatePinParams) {
  assertMaxLength({ value: params.title, max: 100, label: 'Title' });
  assertMaxLength({ value: params.description, max: 800, label: 'Description' });
  assertMaxLength({ value: params.alt_text, max: 500, label: 'Alt text' });
  if (params.link) {
    assertUrl({ value: params.link, label: 'Destination Link' });
  }

  if (params.dominant_color !== undefined && params.dominant_color !== '') {
    if (!/^#[0-9A-Fa-f]{6}$/.test(params.dominant_color)) {
      throw new Error(
        'Pin Color must be a valid hex color format (e.g., #6E7874)'
      );
    }
  }

  const body: Record<string, unknown> = {
    board_id: params.board_id,
    title: params.title,
    media_source: buildMediaSource({
      mediaSourceType: params.media_source_type,
      mediaUrl: params.media_url,
    }),
  };

  if (params.board_section_id) body['board_section_id'] = params.board_section_id;
  if (params.description) body['description'] = params.description;
  if (params.link) body['link'] = params.link;
  if (params.dominant_color) body['dominant_color'] = params.dominant_color;
  if (params.alt_text) body['alt_text'] = params.alt_text;
  if (params.parent_pin_id) body['parent_pin_id'] = params.parent_pin_id;
  if (params.note) body['note'] = params.note;
  if (params.sponsor_id) body['sponsor_id'] = params.sponsor_id;
  if (typeof params.is_removable === 'boolean') {
    body['is_removable'] = params.is_removable;
  }
  if (params.product_tags !== undefined && params.product_tags.length > 0) {
    body['product_tags'] = params.product_tags;
  }

  return await makeRequest(
    params.accessToken,
    HttpMethod.POST,
    buildPath('/pins', { ad_account_id: params.ad_account_id }),
    body
  );
}

async function createBoardOperation(params: CreateBoardParams) {
  assertMaxLength({ value: params.name, max: 180, label: 'Board name' });
  assertMaxLength({
    value: params.description,
    max: 500,
    label: 'Board description',
  });

  const body: Record<string, unknown> = {
    name: params.name,
    is_ads_only: params.is_ads_only,
  };
  if (params.description) body['description'] = params.description;
  if (params.privacy) body['privacy'] = params.privacy;

  return await makeRequest(
    params.accessToken,
    HttpMethod.POST,
    buildPath('/boards', { ad_account_id: params.ad_account_id }),
    body
  );
}

async function updateBoardOperation(params: UpdateBoardParams) {
  const trimmedName = params.name?.trim();
  const trimmedDescription = params.description?.trim();

  if (!trimmedName && !trimmedDescription && !params.privacy) {
    throw new Error(
      'At least one field (name, description, or privacy) must be provided to update the board.'
    );
  }

  assertMaxLength({ value: params.name, max: 180, label: 'Board name' });
  assertMaxLength({
    value: params.description,
    max: 500,
    label: 'Board description',
  });

  const body: Record<string, unknown> = {};
  if (trimmedName) {
    body['name'] = trimmedName;
  }
  if (trimmedDescription) {
    body['description'] = trimmedDescription;
  }
  if (params.privacy) {
    body['privacy'] = params.privacy;
  }

  try {
    return await makeRequest(
      params.accessToken,
      HttpMethod.PATCH,
      buildPath(`/boards/${params.board_id}`, {
        ad_account_id: params.ad_account_id,
      }),
      body
    );
  } catch (error) {
    throw new Error(
      `Failed to update board: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function deletePinOperation(params: DeletePinParams) {
  await makeRequest(
    params.accessToken,
    HttpMethod.DELETE,
    buildPath(`/pins/${params.pin_id}`, {
      ad_account_id: params.ad_account_id,
    })
  );

  return {
    success: true,
    message: `Pin ${params.pin_id} has been successfully deleted.`,
    pin_id: params.pin_id,
  };
}

async function searchBoardsOperation(params: SearchParams) {
  try {
    return await makeRequest(
      params.accessToken,
      HttpMethod.GET,
      buildPath('/search/boards/', {
        query: params.query,
        ad_account_id: params.ad_account_id,
        bookmark: params.bookmark,
      })
    );
  } catch (error) {
    throw new Error(
      `Failed to search boards: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function searchPinsOperation(
  params: SearchParams & { max_results?: number }
): Promise<SearchPinsResult> {
  const limit = Math.min(
    250,
    Math.max(1, Math.floor(params.max_results ?? DEFAULT_MAX_RESULTS))
  );
  const cursor = decodeCursor(params.bookmark);

  let items: unknown[] = [];
  let pageBookmark: string | null = cursor.bookmark;
  let requestedBookmark: string | null = cursor.bookmark;
  let nextBookmark: string | undefined = undefined;
  let lastPageStart = 0;
  let lastPageSkipped = 0;

  for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
    const response: unknown = await makeRequest(
      params.accessToken,
      HttpMethod.GET,
      buildPath('/search/pins', {
        query: params.query,
        bookmark: pageBookmark ?? undefined,
        ad_account_id: params.ad_account_id,
      })
    );

    if (!isRecord(response) || !Array.isArray(response['items'])) {
      throw new Error(
        'Pinterest returned an unexpected response for the Pin search'
      );
    }

    const rawItems: unknown[] = response['items'];

    if (page === 0 && cursor.skip > rawItems.length) {
      throw new Error(
        'Bookmark does not match this search. Start again without a bookmark.'
      );
    }

    const skipped = page === 0 ? cursor.skip : 0;
    const responseBookmark = response['bookmark'];

    requestedBookmark = pageBookmark;
    lastPageStart = items.length;
    lastPageSkipped = skipped;
    items = [...items, ...rawItems.slice(skipped)];
    nextBookmark =
      typeof responseBookmark === 'string' && responseBookmark.length > 0
        ? responseBookmark
        : undefined;

    if (!nextBookmark || items.length >= limit || rawItems.length === 0) {
      break;
    }
    pageBookmark = nextBookmark;
  }

  const cutInsidePage = items.length > limit;
  const limitedItems = cutInsidePage ? items.slice(0, limit) : items;

  return {
    items: limitedItems,
    bookmark: cutInsidePage
      ? encodeCursor({
          bookmark: requestedBookmark,
          skip: lastPageSkipped + (limit - lastPageStart),
        })
      : nextBookmark,
    total_results: limitedItems.length,
    query_used: params.query,
    has_more: cutInsidePage || !!nextBookmark,
  };
}

function buildMediaSource({
  mediaSourceType,
  mediaUrl,
}: {
  mediaSourceType: string;
  mediaUrl: string;
}): Record<string, string> {
  if (mediaSourceType !== 'image_url' && mediaSourceType !== 'image_base64') {
    throw new Error(
      'Video Pins are not supported by this action. Choose Image URL or Base64 Image.'
    );
  }

  if (mediaSourceType !== 'image_base64') {
    assertUrl({ value: mediaUrl, label: 'Image URL' });
    return { source_type: mediaSourceType, url: mediaUrl };
  }

  const trimmed = mediaUrl.trim();
  const dataUri = /^data:([^;,]*)((?:;[^;,]*)*),/.exec(trimmed);
  const isBase64Uri =
    dataUri !== null &&
    dataUri[2].split(';').some((param) => param.toLowerCase() === 'base64');

  if (dataUri && !isBase64Uri) {
    throw new Error(
      'Media data URI must be base64 encoded (data:image/png;base64,...)'
    );
  }

  const data = (dataUri ? trimmed.slice(dataUri[0].length) : trimmed)
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  if (!BASE64_PATTERN.test(data)) {
    throw new Error('Media must be valid base64 when the type is Base64 Image');
  }

  const declaredType =
    dataUri && dataUri[1].length > 0 ? dataUri[1].toLowerCase() : undefined;
  const contentType = declaredType ?? detectImageContentType(data);

  if (!contentType || !SUPPORTED_IMAGE_TYPES.has(contentType)) {
    throw new Error(
      'Media must be a JPEG or PNG image, as a data URI or raw base64'
    );
  }

  return {
    source_type: 'image_base64',
    content_type: contentType,
    data,
  };
}

function detectImageContentType(base64: string): string | undefined {
  const signature = base64.slice(0, 8);
  if (signature.startsWith('/9j/')) return 'image/jpeg';
  if (signature.startsWith('iVBORw0K')) return 'image/png';
  return undefined;
}

function encodeCursor({
  bookmark,
  skip,
}: {
  bookmark: string | null;
  skip: number;
}): string {
  const payload = JSON.stringify({ b: bookmark, s: skip });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${CURSOR_PREFIX}${encoded}`;
}

function decodeCursor(value: string | undefined): {
  bookmark: string | null;
  skip: number;
} {
  if (!value) {
    return { bookmark: null, skip: 0 };
  }

  if (!value.startsWith(CURSOR_PREFIX)) {
    return { bookmark: value, skip: 0 };
  }

  const decoded = parseCursorPayload(value.slice(CURSOR_PREFIX.length));

  if (!isRecord(decoded)) {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  const cursorBookmark = decoded['b'];
  const cursorSkip = decoded['s'];

  if (cursorBookmark !== null && typeof cursorBookmark !== 'string') {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  if (
    typeof cursorSkip !== 'number' ||
    !Number.isInteger(cursorSkip) ||
    cursorSkip < 0
  ) {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  return { bookmark: cursorBookmark, skip: cursorSkip };
}

function parseCursorPayload(encoded: string): unknown {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }
}

export const pinterestOperations = {
  createPin: createPinOperation,
  createBoard: createBoardOperation,
  updateBoard: updateBoardOperation,
  deletePin: deletePinOperation,
  searchBoards: searchBoardsOperation,
  searchPins: searchPinsOperation,
};

const DEFAULT_MAX_RESULTS = 25;
const MAX_SEARCH_PAGES = 10;
const CURSOR_PREFIX = 'apc1.';
const INVALID_CURSOR_MESSAGE = 'Bookmark is not a valid Find Pin bookmark';
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
