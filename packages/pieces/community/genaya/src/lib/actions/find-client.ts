import { createAction, Property } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi, ListPage } from '../common/client';
import { genayaInput } from '../common/input';
import { genayaOutput } from '../common/mappers';
import { GenayaClient } from '../common/types';

export const findClient = createAction({
  auth: genayaAuth,
  name: 'find_client',
  classification: 'SEARCH',
  displayName: 'Find Client',
  description: 'Finds clients in Genaya by email, phone or name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up Genaya clients by exact email, by phone number, or by part of the name or company. Use it to get a client ID before creating an appointment or invoice for that client. Email and phone are matched by Genaya across all clients; a name search checks the 500 most recent clients. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      defaultValue: 'email',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Name or company', value: 'name' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description:
        'The email (exact match, not case sensitive), the phone number (for example +14155550142 or 4155550142), or part of the client\'s name or company. A name search checks the 500 most recent clients.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const searchBy = context.propsValue.search_by;
    const value = genayaInput.text(context.propsValue.search_value);
    if (value === undefined) {
      throw new Error('Enter a value to search for.');
    }
    const clients =
      searchBy === 'name'
        ? await findByName({ apiKey, name: value })
        : (
            await genayaApi.listPage<GenayaClient>({
              apiKey,
              path: '/clients',
              query: searchBy === 'phone' ? { phone: value } : { email: value },
            })
          ).data;
    return {
      found: clients.length > 0,
      count: clients.length,
      clients: clients.map((client) => genayaOutput.client(client)),
    };
  },
});

// The API has no name filter, so walk the newest clients page by page and stop
// at the first page with a match.
async function findByName({ apiKey, name }: { apiKey: string; name: string }): Promise<GenayaClient[]> {
  const needle = name.toLowerCase();
  const isMatch = (client: GenayaClient) =>
    [client.fullName, [client.firstName, client.lastName].filter(Boolean).join(' '), client.company]
      .filter((candidate): candidate is string => typeof candidate === 'string' && candidate !== '')
      .some((candidate) => candidate.toLowerCase().includes(needle));
  let cursor: string | null = null;
  for (let page = 0; page < NAME_SEARCH_PAGES; page++) {
    const result: ListPage<GenayaClient> = await genayaApi.listPage<GenayaClient>({
      apiKey,
      path: '/clients',
      query: cursor ? { from: NAME_SEARCH_FROM, starting_after: cursor } : { from: NAME_SEARCH_FROM },
    });
    const matches = result.data.filter(isMatch);
    if (matches.length > 0) {
      return matches;
    }
    if (!result.has_more || !result.next_cursor) {
      return [];
    }
    cursor = result.next_cursor;
  }
  return [];
}

const NAME_SEARCH_PAGES = 5;
const NAME_SEARCH_FROM = '2000-01-01';
