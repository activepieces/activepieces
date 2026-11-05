import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'search_public_pastes',
  classification: 'SEARCH',
  displayName: 'Search Public Pastes',
  description: 'Searches public pastes from everyone on the instance.',
  audience: 'both',
  aiMetadata: {
    description: 'Searches PUBLIC pastes from all users on the Pastefy instance by text and tags, from all public pastes, the latest or the trending list. Returns one page {pastes, page, page_limit, count, has_more}; has_more true means request page + 1. Content is cut to 300 characters unless Shorten Content is off. Read-only and idempotent. Works without an API key.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text to search for.', required: false }),
    list: Property.StaticDropdown({
      displayName: 'List',
      description: 'Which public list to search.',
      required: false,
      defaultValue: 'public',
      options: { options: [
        { label: 'All public pastes', value: 'public' },
        { label: 'Latest', value: 'latest' },
        { label: 'Trending', value: 'trending' },
      ] },
    }),
    tags: Property.Array({ displayName: 'Tags', description: 'Only pastes with these tags.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    page_limit: Property.Number({ displayName: 'Page Size', description: 'Pastes per page, 1 to 50.', required: false, defaultValue: 20 }),
    shorten_content: Property.Checkbox({ displayName: 'Shorten Content', description: 'Cut content to 300 characters.', required: false, defaultValue: true }),
  },
  outputSchema: pastefyOutputSchemas.pasteList,
  async run({ auth, propsValue }) {
    const list = propsValue.list;
    return pastefyRequests.listPastes({
      auth,
      source: list === 'latest' || list === 'trending' ? list : 'public',
      search: propsValue.search,
      tags: propsValue.tags,
      page: propsValue.page,
      pageLimit: propsValue.page_limit,
      shortenContent: propsValue.shorten_content,
    });
  },
});
