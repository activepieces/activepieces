import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteDomainOutputSchema } from '../output-schemas';

export const deleteDomain = createAction({
  name: 'delete_domain',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Domain',
  outputSchema: deleteDomainOutputSchema,
  description: 'Remove a domain from your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a sending domain from the Resend account, identified by its domain ID. Use this to decommission a domain you no longer send from. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
  props: {
    domain_id: resendProps.domainId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/domains/${propsValue.domain_id}` });
  },
});
