import { createAction, Property } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { findKlentyProspectByEmail } from '../common/client';
import { listNameProp } from '../common/props';

export const getProspectAction = createAction({
  name: 'get_prospect',
  displayName: 'Get Prospect',
  description:
    'Find a prospect by email using Klenty\'s list prospects API. Supply a list when possible for faster, more reliable lookup.',
  auth: klentyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    listName: listNameProp,
  },
  async run({ auth, propsValue }) {
    const prospect = await findKlentyProspectByEmail({
      auth,
      email: propsValue.email,
      listName: propsValue.listName ?? undefined,
    });

    if (!prospect) {
      throw new Error(
        `Prospect ${propsValue.email} was not found in Klenty${
          propsValue.listName ? ` list ${propsValue.listName}` : ''
        }.`,
      );
    }

    return prospect;
  },
});
