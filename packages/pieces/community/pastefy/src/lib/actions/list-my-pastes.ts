import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'list_my_pastes',
  classification: 'SEARCH',
  displayName: 'List My Pastes',
  description: 'Lists pastes in your account, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists pastes owned by the connected account, newest first, filtered by search text, folder ID and tags. Returns one page {pastes, page, page_limit, count, has_more}; has_more true means request page + 1. Content is cut to 300 characters unless Shorten Content is off. Read-only and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text to search for in title and content.', required: false }),
    folder_id: Property.ShortText({ displayName: 'Folder ID', description: 'Only pastes in this folder (ID from Get Folder Hierarchy or List Folders).', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Only pastes with these tags.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    page_limit: Property.Number({ displayName: 'Page Size', description: 'Pastes per page, 1 to 50.', required: false, defaultValue: 20 }),
    shorten_content: Property.Checkbox({ displayName: 'Shorten Content', description: 'Cut content to 300 characters.', required: false, defaultValue: true }),
  },
  outputSchema: pastefyOutputSchemas.pasteList,
  async run({ auth, propsValue }) {
    return pastefyRequests.listPastes({
      auth,
      source: 'mine',
      search: propsValue.search,
      folderId: propsValue.folder_id,
      tags: propsValue.tags,
      page: propsValue.page,
      pageLimit: propsValue.page_limit,
      shortenContent: propsValue.shorten_content,
    });
  },
});
