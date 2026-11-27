import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const listTermsOfServiceUserStatusesAction = createAction({
  auth: boxAuth,
  name: 'box_list_terms_of_service_user_statuses',
  displayName: 'List Terms of Service User Statuses',
  description: 'Lists which users accepted a Box terms of service.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the users\' statuses for a terms of service, each with its status ID, user and whether they accepted. Needs admin rights. Get the terms of service ID from List Terms of Service; filter to one user with User ID.',
    idempotent: true,
  },
  props: {
    termsOfServiceId: boxAiProps.termsOfServiceId({ required: true }),
    userId: boxAiProps.userId({
      required: false,
      description: "Only return this user's status. Get it from List Users or Get Current User.",
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/terms_of_service_user_statuses',
      query: { tos_id: propsValue.termsOfServiceId, user_id: propsValue.userId },
    });
  },
});
