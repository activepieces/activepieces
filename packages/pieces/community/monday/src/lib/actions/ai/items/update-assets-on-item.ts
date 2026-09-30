import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { itemCommon } from './item-common';
import { makeClient } from '../../../common';
import { updateAssetsOnItemActionOutputSchema } from '../../../output-schemas';

export const updateAssetsOnItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_assets_on_item',
  classification: 'WRITE',
  displayName: 'Update Files on Item',
  description: 'Sets the files of a file column from existing assets, docs or links.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set the contents of a file column on a monday.com item from files that already exist: uploaded assets (by asset ID), monday docs (by doc object ID), or links (Google Drive, Dropbox, OneDrive, Box or a plain URL). Use Upload File to upload new file bytes. Safe to retry with the same list.',
    idempotent: true,
  },
  outputSchema: updateAssetsOnItemActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_id: mondayAiProps.itemId(),
    column_id: Property.ShortText({
      displayName: 'File Column ID',
      description: 'The ID of a file-type column. Resolve it with List Columns.',
      required: true,
    }),
    files: Property.Array({
      displayName: 'Files',
      required: true,
      properties: {
        file_type: Property.StaticDropdown({
          displayName: 'File Type',
          required: true,
          options: {
            options: [
              { label: 'Uploaded asset', value: 'asset' },
              { label: 'monday doc', value: 'doc' },
              { label: 'Link', value: 'link' },
              { label: 'Google Drive', value: 'google_drive' },
              { label: 'Dropbox', value: 'dropbox' },
              { label: 'OneDrive', value: 'onedrive' },
              { label: 'Box', value: 'box' },
            ],
          },
        }),
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
        asset_id: Property.ShortText({
          displayName: 'Asset ID',
          description: 'Required for uploaded assets. Resolve it with Get Assets.',
          required: false,
        }),
        object_id: Property.ShortText({
          displayName: 'Doc Object ID',
          description: 'Required for monday docs.',
          required: false,
        }),
        link_to_file: Property.ShortText({
          displayName: 'Link',
          description: 'Required for links and cloud storage files.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { board_id, item_id, column_id } = context.propsValue;
    const files = toFileInputs({ rows: context.propsValue.files });
    if (files.length === 0) {
      throw new Error('Provide at least one file with a File Type and Name.');
    }

    const data = await makeClient(context.auth).query<{
      update_assets_on_item: { id: string; assets: { id: string; name: string; url: string | null }[] | null };
    }>({
      query: `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $files: [FileInput!]!) {
        update_assets_on_item(board_id: $boardId, item_id: $itemId, column_id: $columnId, files: $files) {
          id
          assets { id name url }
        }
      }`,
      variables: { boardId: board_id, itemId: item_id, columnId: column_id, files },
    });

    const assets = (data.update_assets_on_item.assets ?? []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      url: asset.url ?? null,
    }));
    return { item_id: data.update_assets_on_item.id, assets, count: assets.length };
  },
});

function toFileInputs({ rows }: { rows: unknown }): FileInput[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row: unknown) => {
      const fileType = itemCommon.readString({ row, key: 'file_type' });
      const name = itemCommon.readString({ row, key: 'name' });
      if (isNil(fileType) || isNil(name)) {
        return null;
      }
      const assetId = itemCommon.readString({ row, key: 'asset_id' });
      const objectId = itemCommon.readString({ row, key: 'object_id' });
      const linkToFile = itemCommon.readString({ row, key: 'link_to_file' });
      return {
        fileType,
        name,
        ...(isNil(assetId) ? {} : { assetId }),
        ...(isNil(objectId) ? {} : { objectId }),
        ...(isNil(linkToFile) ? {} : { linkToFile }),
      };
    })
    .filter((file): file is FileInput => !isNil(file));
}

type FileInput = {
  fileType: string;
  name: string;
  assetId?: string;
  objectId?: string;
  linkToFile?: string;
};
