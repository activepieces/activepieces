import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { partyListOutputSchema } from '../common/output-schemas';

export const findContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_contact',
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Find a Person by search criteria. Returns up to 1,000 matches (10 pages); narrow the search if you need more.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Capsule CRM contacts by a free-text term (such as a name or email) and returns only matches of type person, filtering out organisations. Use to look up an existing person before creating or referencing one. Idempotent: it is a read-only search that does not modify any data.',
    idempotent: true,
  },
  outputSchema: partyListOutputSchema,
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The value to search for (e.g., a name or email).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const parties = await capsuleCrmClient.findContact({ auth, term: propsValue.term });
    return parties.filter((party) => party.type === 'person');
  },
});
