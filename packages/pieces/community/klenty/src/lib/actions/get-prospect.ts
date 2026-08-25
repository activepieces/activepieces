import { createAction, Property } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { findKlentyProspectByEmail } from '../common/client';

export const getProspectAction = createAction({
  name: 'get_prospect',
  displayName: 'Get Prospect by Email',
  description: 'Find a prospect by email address in Klenty.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single Klenty prospect by exact email address and returns their record, throwing an error if no prospect matches. Use to read or verify a prospect before updating or enrolling them. Read-only and idempotent.',
    idempotent: true,
  },
  auth: klentyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the prospect to find.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const prospect = await findKlentyProspectByEmail({
      auth,
      email: propsValue.email,
    });

    if (!prospect) {
      throw new Error(`Prospect ${propsValue.email} was not found in Klenty.`);
    }

    return prospect;
  },
});
