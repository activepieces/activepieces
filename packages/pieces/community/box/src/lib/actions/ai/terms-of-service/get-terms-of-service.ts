import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getTermsOfServiceAction = createAction({
  auth: boxAuth,
  name: 'box_get_terms_of_service',
  displayName: 'Get Terms of Service',
  description: 'Gets a Box terms of service by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one terms of service with its type, status and text. Needs admin rights. Get the ID from List Terms of Service or Create Terms of Service.',
    idempotent: true,
  },
  props: {
    termsOfServiceId: boxAiProps.termsOfServiceId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/terms_of_services/${encodeURIComponent(propsValue.termsOfServiceId)}`,
    });
  },
});
