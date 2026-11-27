import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListGroupsOutputSchema } from '../../../output-schemas';

export const listGroupsAction = createAction({
  auth: boxAuth,
  name: 'box_list_groups',
  outputSchema: boxListGroupsOutputSchema,
  displayName: 'List Groups',
  description: 'Lists the groups in the Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of enterprise groups with their IDs and names; needs admin rights. Filter by the start of a name with Filter Term. Page with Offset.',
    idempotent: true,
  },
  props: {
    filterTerm: Property.ShortText({
      displayName: 'Filter Term',
      description: 'Only groups whose name starts with this text.',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    offset: boxAiProps.offset({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/groups',
      query: {
        filter_term: propsValue.filterTerm,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        fields: propsValue.fields,
      },
    });
  },
});
