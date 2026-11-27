import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getCollaborationDomainExemptionAction = createAction({
  auth: boxAuth,
  name: 'box_get_collaboration_domain_exemption',
  displayName: 'Get Collaboration Domain Exemption',
  description: 'Gets a collaboration domain restriction exemption by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one user exemption from collaboration domain restrictions, with the exempt user. Needs admin rights. Get the ID from List Collaboration Domain Exemptions or Create Collaboration Domain Exemption.',
    idempotent: true,
  },
  props: {
    exemptionId: boxAiProps.domainExemptionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/collaboration_whitelist_exempt_targets/${encodeURIComponent(propsValue.exemptionId)}`,
    });
  },
});
