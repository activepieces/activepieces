import { createAction } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { normalizeCustomerId } from '../common/client';
import { customerIdProp } from '../common/props';
import {
  mutateRecord,
  recordIdentifierProp,
  resourceDefinition,
  resourceTypeProp,
  validateOnlyProp,
} from '../common/records';
import { resourceNameFor } from '../common/resources';
import { deleteRecordOutputSchema } from '../output-schemas';

export const deleteRecord = createAction({
  name: 'deleteRecord',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Remove a campaign, ad group, ad, keyword or audience list (Google marks it REMOVED; it cannot be restored)',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently remove a Google Ads campaign, ad group, ad, keyword or audience list by id or resource name; Google marks it REMOVED and it cannot be restored. To stop delivery reversibly, use Update record with status PAUSED instead. A retry of a completed removal fails.',
    idempotent: false,
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    resourceType: resourceTypeProp,
    identifier: recordIdentifierProp,
    validateOnly: validateOnlyProp,
  },
  outputSchema: deleteRecordOutputSchema,
  async run(context) {
    const { customerId, resourceType, identifier, validateOnly } = context.propsValue;
    const def = resourceDefinition(resourceType);
    const resourceName = resourceNameFor({ def, customerId: normalizeCustomerId(customerId), identifier });

    const result = await mutateRecord({
      auth: context.auth,
      customerId,
      def,
      operation: { remove: resourceName },
      validateOnly: Boolean(validateOnly),
    });
    return { ...result, resourceName: result.resourceName ?? resourceName, removed: !validateOnly };
  },
});
