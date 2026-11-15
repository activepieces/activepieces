import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseInput } from '../../common/input';
import { discourseLists } from '../../common/lists';
import { discourseSchemas } from '../../common/schemas';

export const listUserPrivateMessagesAction = createAction({
  auth: discourseAuth,
  name: 'list_user_private_messages',
  classification: 'SEARCH',
  displayName: 'List User Private Messages',
  description: 'Lists the private message conversations of a user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the private message conversations of a Discourse user by username, 30 per page starting at 0. Works for the API Username itself, or for any user with an admin key. Each item is a topic; read it with Get Topic Posts and answer with Reply to Topic. Read-only.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
    folder: Property.StaticDropdown({
      displayName: 'Folder',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Sent', value: 'sent' },
          { label: 'Unread', value: 'unread' },
          { label: 'New', value: 'new' },
          { label: 'Archive', value: 'archive' },
        ],
      },
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number starting at 0.', required: false }),
  },
  outputSchema: discourseSchemas.topicPage,
  async run({ auth, propsValue }) {
    const username = discourseInput.name({ value: propsValue.username, label: 'Username' });
    const folder = typeof propsValue.folder === 'string' && FOLDERS.includes(propsValue.folder) ? propsValue.folder : 'all';
    const path =
      folder === 'all' ? `/topics/private-messages/${username}.json` : `/topics/private-messages-${folder}/${username}.json`;
    return discourseLists.topicPage({ auth: auth.props, path, page: propsValue.page });
  },
});

const FOLDERS = ['all', 'sent', 'unread', 'new', 'archive'];
