import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const listFileVersionsAction = createAction({
  auth: figmaAuth,
  name: 'list_file_versions',
  classification: 'SEARCH',
  displayName: 'List File Versions',
  description: 'Lists the version history of a Figma file, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists versions of a Figma file newest first as {items, nextCursor, hasMore}; each item has id, label, description, created_at and user. Pass nextCursor back as Cursor for older versions. Named versions have a label; autosaves have none. Needs the file_versions:read scope. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.listVersions,
  props: {
    file_key: figmaProps.fileKey(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Versions per page, 1 to 50. Default 30.',
      required: false,
    }),
    cursor: figmaProps.cursor,
  },
  async run(context) {
    const { fileKey } = figmaClient.parseFileKey(context.propsValue.file_key);
    const limit = figmaClient.optionalInteger({ value: context.propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const cursor = figmaClient.optionalText(context.propsValue.cursor);
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/files/${figmaClient.segment({ value: fileKey, label: 'File Key' })}/versions`,
      query: { page_size: limit, before: cursor },
      scope: 'file_versions:read',
      tier: 2,
      operation: 'list the file versions',
    });
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    const items = Array.isArray(body['versions']) ? body['versions'] : [];
    const pagination = figmaClient.isRecord(body['pagination']) ? body['pagination'] : {};
    const nextCursor = items.length > 0 ? figmaClient.cursorFromNextPage({ nextPage: pagination['next_page'], param: 'before' }) : null;
    return { items, nextCursor, hasMore: nextCursor !== null };
  },
});
