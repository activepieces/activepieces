import { createAction, Property } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { findKlentyProspectByEmail } from '../common/client';

export const getProspectAction = createAction({
  name: 'get_prospect',
  displayName: 'Get Prospect',
  description: 'Find a prospect by email address in Klenty.',
  auth: klentyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
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
