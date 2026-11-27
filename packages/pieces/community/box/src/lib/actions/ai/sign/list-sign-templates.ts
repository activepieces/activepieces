import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listSignTemplatesAction = createAction({
  auth: boxAuth,
  name: 'box_list_sign_templates',
  displayName: 'List Sign Templates',
  description: 'Lists the Box Sign templates the user can use.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists one page of Box Sign templates with their IDs, names and source files. Page with Marker (next_marker). Use a template ID in Create Sign Request.',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/sign_templates',
      query: { marker: propsValue.marker, limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }) },
    });
  },
});
