import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooCreateSuppressionOutputSchema } from '../../output-schemas';

export const mailerooCreateSuppression = createAction({
  auth: mailerooAuth,
  name: 'maileroo_create_suppression',
  outputSchema: mailerooCreateSuppressionOutputSchema,
  displayName: 'Add Suppression',
  description: 'Adds an email address to the suppression list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Blocks an address so no email is delivered to it until it is removed with maileroo_delete_suppression. Adding an address already suppressed leaves it suppressed. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Address to suppress.',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Optional note on why it was suppressed.',
      required: false,
    }),
  },
  async run(context) {
    const { email_address, reason } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/suppressions',
      body: {
        email_address,
        ...spreadIfDefined('reason', reason),
      },
    });
  },
});
