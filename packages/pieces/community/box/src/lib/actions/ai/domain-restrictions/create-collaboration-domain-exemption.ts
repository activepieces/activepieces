import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createCollaborationDomainExemptionAction = createAction({
  auth: boxAuth,
  name: 'box_create_collaboration_domain_exemption',
  displayName: 'Create Collaboration Domain Exemption',
  description: 'Exempts a user from Box collaboration domain restrictions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Lets a user collaborate with any domain despite the enterprise\'s collaboration domain restrictions, and returns the exemption ID. Needs admin rights. Get the user ID from List Users.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({
      required: true,
      description: 'Box user ID to exempt. Get it from List Users or Get Current User.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/collaboration_whitelist_exempt_targets',
      body: { user: { id: propsValue.userId } },
    });
  },
});
