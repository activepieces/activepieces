import {
  PiecePropValueSchema,
  PiecePropertyMap,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { PastefyClient } from './client';
import { FolderHierarchy } from './models/folder';
import { PasteVisibility } from './models/paste';
import { pastefyAuth } from '../..';

interface FlatFolder {
  id: string;
  name: string;
}

function flattenFolderHierarchy(hierarchy: FolderHierarchy[]): FlatFolder[] {
  const folders: FlatFolder[] = [];
  for (const h of hierarchy) {
    folders.push({ id: h.id, name: h.name });
    flattenFolderHierarchy(h.children).forEach((e) => {
      folders.push({
        id: e.id,
        name: h.name + ' / ' + e.name,
      });
    });
  }
  return folders;
}

export function formatDate(date?: string): string | undefined {
  if (!date) return date;
  return date
    .replace('T', ' ')
    .replace('Z', '')
    .replace(/\.[0-9]{3}/, '');
}

export const pastefyCommon = {
  folder_id: (required = true, displayName = 'Folder') =>
    Property.Dropdown({
      description: 'A folder',
      displayName: displayName,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient(
          auth as PiecePropValueSchema<typeof pastefyAuth>,
          { auth }
        );
        const folders = await client.getFolderHierarchy();

        return {
          disabled: false,
          options: flattenFolderHierarchy(folders).map((folder) => {
            return {
              label: folder.name,
              value: folder.id,
            };
          }),
        };
      },
    }),
  visibility: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Visibility',
      required,
      options: {
        options: [
          { label: 'Public', value: PasteVisibility.PUBLIC },
          { label: 'Unlisted', value: PasteVisibility.UNLISTED },
          { label: 'Private', value: PasteVisibility.PRIVATE },
        ],
      },
    }),
};

export function makeClient(
  auth: PiecePropValueSchema<typeof pastefyAuth>,
  propsValue: StaticPropsValue<PiecePropertyMap>
): PastefyClient {
  return new PastefyClient(auth.token || undefined, propsValue.instance_url);
}
