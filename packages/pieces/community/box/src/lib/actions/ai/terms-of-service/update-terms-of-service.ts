import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const STATUSES = ['enabled', 'disabled'];

export const updateTermsOfServiceAction = createAction({
  auth: boxAuth,
  name: 'box_update_terms_of_service',
  displayName: 'Update Terms of Service',
  description: 'Changes the status and text of a Box terms of service.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets a terms of service\'s status and text; Box needs both, so pass the current text (from Get Terms of Service) when only changing the status. Needs admin rights. Get the ID from List Terms of Service.',
    idempotent: true,
  },
  props: {
    termsOfServiceId: boxAiProps.termsOfServiceId({ required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"enabled" to show it to users, or "disabled".',
      required: true,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The full terms of service text. It replaces the current text.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (!STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/terms_of_services/${encodeURIComponent(propsValue.termsOfServiceId)}`,
      body: { status: propsValue.status, text: propsValue.text },
    });
  },
});
