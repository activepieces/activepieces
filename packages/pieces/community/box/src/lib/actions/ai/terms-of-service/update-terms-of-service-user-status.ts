import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const BOOLEANS = ['true', 'false'];

export const updateTermsOfServiceUserStatusAction = createAction({
  auth: boxAuth,
  name: 'box_update_terms_of_service_user_status',
  displayName: 'Update Terms of Service User Status',
  description: 'Changes whether a user accepted a Box terms of service.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets an existing terms of service user status to accepted or not accepted. Get the status ID from List Terms of Service User Statuses or Create Terms of Service User Status.',
    idempotent: true,
  },
  props: {
    statusId: Property.ShortText({
      displayName: 'User Status ID',
      description: 'Terms of service user status ID (not the user ID). Get it from List Terms of Service User Statuses.',
      required: true,
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
      method: HttpMethod.PUT,
      path: `/terms_of_service_user_statuses/${encodeURIComponent(propsValue.statusId)}`,
      body: { is_accepted: propsValue.isAccepted === 'true' },
    });
  },
});
