import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sheetDropdown, sendrApiCall } from '../common';

export const getSheetColumns = createAction({
  auth: sendrAuth,
  name: 'get_sheet_columns',
  displayName: 'Get Sheet Columns',
  description: 'Returns all columns (fields) of a contact list, including their enrichment status.',
  props: {
    sheet: sheetDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<{
      columns: { id: string; name?: string; type?: string; enriched?: boolean; [key: string]: unknown }[];
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/sheet/${context.propsValue.sheet}/column`,
    });

    const columns = response.body?.columns ?? [];
    return columns.map((col) => ({
      id: col.id,
      name: col.name ?? null,
      type: col.type ?? null,
      enriched: col.enriched ?? null,
    }));
  },
});
