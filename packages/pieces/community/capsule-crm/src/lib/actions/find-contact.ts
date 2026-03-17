import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const findContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a Person by search criteria.',
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The value to search for (e.g., a name or email).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const parties = await capsuleCrmClient.findContact(auth, propsValue.term);
    return parties.filter((party) => party.type === 'person');
  },
});
