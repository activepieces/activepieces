import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformPage, TypeformRecord } from '../common';
import { themesOutputSchema } from '../output-schemas';

export const listThemesAction = createAction({
  auth: typeformAuth,
  name: 'list_themes',
  classification: 'SEARCH',
  displayName: 'List Themes',
  description: 'Lists themes available to the Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Typeform themes with each ID, name, font, colors and visibility: private themes belong to the account and can be edited, public ones are Typeform presets. Paginated with Page and Page Size (up to 200). Read-only.',
    idempotent: true,
  },
  outputSchema: themesOutputSchema,
  props: {
    page: typeformCommon.page,
    pageSize: typeformCommon.pageSize,
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformPage<TypeformRecord>>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: '/themes',
      queryParams: typeformCommon.pageQuery({
        page: propsValue.page,
        pageSize: propsValue.pageSize,
        maxPageSize: typeformCommon.maxPageSize,
      }),
    });
  },
});
