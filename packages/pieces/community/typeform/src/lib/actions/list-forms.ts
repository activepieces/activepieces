import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformPage, TypeformRecord } from '../common';
import { formsOutputSchema } from '../output-schemas';

export const listFormsAction = createAction({
  auth: typeformAuth,
  name: 'list_forms',
  classification: 'SEARCH',
  displayName: 'List Forms',
  description: 'Lists forms in the Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Typeform forms with each ID, title, public status, created and updated time and share link. Filter by title text and workspace, sort by created or updated time. Paginated with Page and Page Size (up to 200); total_items and page_count show how many pages exist. Use Get Form for the questions. Read-only.',
    idempotent: true,
  },
  outputSchema: formsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only forms whose title contains this text.',
      required: false,
    }),
    workspace: typeformCommon.workspaceId,
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: [
          { label: 'Created at', value: 'created_at' },
          { label: 'Last updated at', value: 'last_updated_at' },
        ],
      },
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    page: typeformCommon.page,
    pageSize: typeformCommon.pageSize,
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformPage<TypeformRecord>>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: '/forms',
      queryParams: {
        search: propsValue.search?.trim(),
        workspace_id: propsValue.workspace,
        sort_by: propsValue.sortBy,
        order_by: propsValue.orderBy,
        ...typeformCommon.pageQuery({
          page: propsValue.page,
          pageSize: propsValue.pageSize,
          maxPageSize: typeformCommon.maxPageSize,
        }),
      },
    });
  },
});
