import { HttpMethod } from '@activepieces/pieces-common';
import { buildPath, makeRequest } from '.';

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
  assertUrl({ value: params.media_url, label: 'Image URL' });
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
    media_source: {
      source_type: params.media_source_type,
      url: params.media_url,
    },
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
  if (
    !params.name &&
    params.description === undefined &&
    !params.privacy
  ) {
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
  if (params.name && params.name.trim()) {
    body['name'] = params.name.trim();
  }
  if (params.description !== undefined) {
    body['description'] = params.description;
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
) {
  try {
    const response = await makeRequest(
      params.accessToken,
      HttpMethod.GET,
      buildPath('/search/pins', {
        query: params.query,
        bookmark: params.bookmark,
        ad_account_id: params.ad_account_id,
      })
    );

    const allItems: unknown[] = response.items ?? [];
    const truncated =
      params.max_results !== undefined && allItems.length > params.max_results;
    const items = truncated ? allItems.slice(0, params.max_results) : allItems;

    return {
      items,
      bookmark: truncated ? null : response.bookmark ?? null,
      total_results: items.length,
      query_used: params.query,
      has_more: truncated || !!response.bookmark,
    };
  } catch (error) {
    throw new Error(
      `Failed to search pins: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
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
