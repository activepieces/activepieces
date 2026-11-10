import { Property } from '@activepieces/pieces-framework';
import { pastefyAuth } from './auth';
import { pastefyRequests } from './requests';

export const pastefyProps = { folderDropdown, visibility, tags };

function folderDropdown({ required, displayName, description }: { required: boolean; displayName: string; description: string }) {
  return Property.Dropdown({
    auth: pastefyAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Pastefy account first.', options: [] };
      }
      try {
        const tree = await pastefyRequests.folderTree({ auth });
        const folders = pastefyRequests.flattenTree({ tree, parentPath: '', parentId: null });
        return {
          disabled: false,
          placeholder: folders.length === 0 ? 'No folders yet.' : undefined,
          options: folders.map((folder) => ({ label: folder.path, value: folder.id })),
        };
      } catch (error) {
        return { disabled: true, placeholder: error instanceof Error ? error.message : 'Could not load folders.', options: [] };
      }
    },
  });
}

function visibility({ required, description }: { required: boolean; description: string }) {
  return Property.StaticDropdown({
    displayName: 'Visibility',
    description,
    required,
    options: { options: VISIBILITY_OPTIONS },
  });
}

function tags({ description }: { description: string }) {
  return Property.Array({ displayName: 'Tags', description, required: false });
}

const VISIBILITY_OPTIONS = [
  { label: 'Public', value: 'PUBLIC' },
  { label: 'Unlisted', value: 'UNLISTED' },
  { label: 'Private', value: 'PRIVATE' },
];
