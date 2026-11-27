import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

const TOS_TYPES = ['external', 'managed'];

export const listTermsOfServiceAction = createAction({
  auth: boxAuth,
  name: 'box_list_terms_of_service',
  displayName: 'List Terms of Service',
  description: 'Lists the Box enterprise\'s terms of service.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the enterprise\'s terms of service (at most one each for managed and external users) with their IDs, status and text. Needs admin rights.',
    idempotent: true,
  },
  props: {
    tosType: Property.StaticDropdown({
      displayName: 'Type',
      description: '"managed" (enterprise users) or "external" (outside collaborators). Leave empty for both.',
      required: false,
      options: { options: TOS_TYPES.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.tosType !== undefined && !TOS_TYPES.includes(propsValue.tosType)) {
      throw new Error(`Type must be one of: ${TOS_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/terms_of_services',
      query: { tos_type: propsValue.tosType },
    });
  },
});
