import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooSuccessOutputSchema } from '../../output-schemas';

export const mailerooDeleteSuppression = createAction({
  auth: mailerooAuth,
  outputSchema: mailerooSuccessOutputSchema,
  name: 'maileroo_delete_suppression',
  displayName: 'Delete Suppression',
  description: 'Removes an address from the suppression list.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Removes a suppression so the address can receive email again. Pass either the numeric suppression ID from maileroo_list_suppressions or the email address itself. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    identifier: Property.ShortText({
      displayName: 'Suppression ID or Email',
      description: 'Numeric suppression ID or the suppressed email address.',
      required: true,
    }),
  },
  async run(context) {
    const { identifier } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/suppressions/${encodeURIComponent(identifier)}`,
    });
  },
});
