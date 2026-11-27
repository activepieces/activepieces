import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];

export const createTermsOfServiceUserStatusAction = createAction({
  auth: boxAuth,
  name: 'box_create_terms_of_service_user_status',
  displayName: 'Create Terms of Service User Status',
  description: 'Records whether a user accepted a Box terms of service.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets a user\'s accepted or rejected status for a terms of service when the user has none yet, and returns the status ID; for a user who already has one use Update Terms of Service User Status. Get the terms of service ID from List Terms of Service and the user ID from List Users.',
    idempotent: false,
  },
  props: {
    termsOfServiceId: boxAiProps.termsOfServiceId({ required: true }),
    userId: boxAiProps.userId({
      required: true,
      description: 'Box user ID. Get it from List Users or Get Current User.',
    }),
    isAccepted: boxAiProps.booleanFlag({
      required: true,
      displayName: 'Accepted',
      description: '"true" if the user accepted the terms, "false" if not.',
    }),
  },
  async run({ auth, propsValue }) {
    if (!BOOLEANS.includes(propsValue.isAccepted)) {
      throw new Error('Accepted must be "true" or "false".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/terms_of_service_user_statuses',
      body: {
        tos: { id: propsValue.termsOfServiceId, type: 'terms_of_service' },
        user: { id: propsValue.userId, type: 'user' },
        is_accepted: propsValue.isAccepted === 'true',
      },
    });
  },
});
