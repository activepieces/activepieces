import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteCollaborationDomainExemptionAction = createAction({
  auth: boxAuth,
  name: 'box_delete_collaboration_domain_exemption',
  displayName: 'Delete Collaboration Domain Exemption',
  description: 'Removes a user\'s exemption from Box collaboration domain restrictions.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a user\'s exemption, so collaboration domain restrictions apply to them again; recreate it with Create Collaboration Domain Exemption. Needs admin rights. Get the exemption ID from List Collaboration Domain Exemptions.',
    idempotent: false,
  },
  props: {
    exemptionId: boxAiProps.domainExemptionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/collaboration_whitelist_exempt_targets/${encodeURIComponent(propsValue.exemptionId)}`,
    });
    return { deleted: true, exemptionId: propsValue.exemptionId };
  },
});
