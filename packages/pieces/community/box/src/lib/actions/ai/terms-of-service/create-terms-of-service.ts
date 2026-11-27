import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

const STATUSES = ['enabled', 'disabled'];
const TOS_TYPES = ['external', 'managed'];

export const createTermsOfServiceAction = createAction({
  auth: boxAuth,
  name: 'box_create_terms_of_service',
  displayName: 'Create Terms of Service',
  description: 'Creates terms of service for Box enterprise or external users.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates the enterprise\'s terms of service for managed or external users and returns its ID; change it later with Update Terms of Service. Needs admin rights. Check List Terms of Service first, since each user type has one.',
    idempotent: false,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"enabled" to show it to users, or "disabled".',
      required: true,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The terms of service text shown to users.',
      required: true,
    }),
    tosType: Property.StaticDropdown({
      displayName: 'Type',
      description: '"managed" (enterprise users) or "external" (outside collaborators).',
      required: false,
      options: { options: TOS_TYPES.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    if (!STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    if (propsValue.tosType !== undefined && !TOS_TYPES.includes(propsValue.tosType)) {
      throw new Error(`Type must be one of: ${TOS_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/terms_of_services',
      body: {
        status: propsValue.status,
        text: propsValue.text,
        ...(propsValue.tosType !== undefined ? { tos_type: propsValue.tosType } : {}),
      },
    });
  },
});
