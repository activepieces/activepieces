import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';

export const removeSuppressionAction = createAction({
  auth: emailitAuth,
  name: 'remove_suppression',
  displayName: 'Remove Suppression',
  description: 'Remove a suppression so Emailit can send to the address again.',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one Emailit suppression by suppression ID (sup_…) or email address so the address can receive email again. An address with several suppression types needs one call per type (use the ID to target one). If nothing matches, returns alreadyRemoved=true instead of failing. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.removed,
  props: {
    suppression: Property.ShortText({ displayName: 'Suppression ID or Email', required: true }),
  },
  async run({ auth, propsValue }) {
    try {
      const body = await emailitClient.request({
        auth,
        method: HttpMethod.DELETE,
        path: `/suppressions/${emailitClient.seg({ value: propsValue.suppression, label: 'Suppression ID or Email' })}`,
        safeToRetry: true,
      });
      return { ...(emailitClient.isRecord(body) ? body : {}), deleted: true, alreadyRemoved: false };
    } catch (error) {
      if (emailitClient.statusOf(error) === 404) {
        return { id: propsValue.suppression.trim(), deleted: false, alreadyRemoved: true };
      }
      throw error;
    }
  },
});
