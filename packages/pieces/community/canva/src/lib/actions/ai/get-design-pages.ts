import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetDesignPagesAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_design_pages',
  displayName: 'Get Design Pages',
  description: 'Lists the pages of a Canva design with thumbnails and sizes.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.aiDesignPages,
  aiMetadata: {
    description:
      'Lists pages of a Canva design: page number, page ID, design type, width/height in pixels (bounded designs only) and a thumbnail URL valid 15 minutes. Use offset (first page 1, max 500) and limit (1-200, default 50) for long designs. Some design types (for example Canva Docs) have no pages and return an empty list. This Canva API is in preview and may change.',
    idempotent: true,
  },
  props: {
    designId: Property.ShortText({ displayName: 'Design ID', description: 'The Canva design ID.', required: true }),
    offset: Property.Number({ displayName: 'Offset', description: 'First page number to return, 1-500. Default 1.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'How many pages to return, 1-200. Default 50.', required: false }),
  },
  async run(context) {
    const { designId, offset, limit } = context.propsValue;
    const id = designId.trim();
    if (!id) {
      throw new Error('Design ID is required.');
    }
    const queryParams: Record<string, string> = {};
    if (offset !== undefined && offset !== null) {
      if (!Number.isInteger(offset) || offset < 1 || offset > 500) {
        throw new Error('Offset must be a whole number between 1 and 500.');
      }
      queryParams['offset'] = String(offset);
    }
    if (limit !== undefined && limit !== null) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
        throw new Error('Limit must be a whole number between 1 and 200.');
      }
      queryParams['limit'] = String(limit);
    }
    const body = await canvaClient.request<{ items?: DesignPage[] }>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/designs/${encodeURIComponent(id)}/pages`,
      queryParams,
    });
    return {
      pages: (body?.items ?? []).map((page) => ({
        page_number: page.page_number ?? page.index ?? null,
        id: page.id ?? null,
        design_type: page.design_type ?? null,
        width: page.dimensions?.width ?? null,
        height: page.dimensions?.height ?? null,
        thumbnail_url: page.thumbnail?.url ?? null,
      })),
    };
  },
});

type DesignPage = {
  page_number?: number;
  index?: number;
  id?: string;
  design_type?: string;
  dimensions?: { width: number; height: number };
  thumbnail?: { url: string };
};
