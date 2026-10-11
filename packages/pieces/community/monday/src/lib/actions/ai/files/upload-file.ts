import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { uploadFileActionOutputSchema } from '../../../output-schemas';

export const uploadFileAction = createAction({
  auth: mondayAuth,
  name: 'monday_upload_file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Uploads a file to an item\'s file column or to an update.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Upload a file (URL or base64, max 500 MB) to monday.com, attaching it either to a file-type column on an item (Target "column" with Item ID and Column ID) or to an existing update (Target "update" with Update ID). Resolve file column IDs with List Columns. Each call uploads another copy, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: uploadFileActionOutputSchema,
  props: {
    target: Property.StaticDropdown({
      displayName: 'Target',
      description: 'Where to attach the file.',
      required: true,
      defaultValue: 'column',
      options: {
        disabled: false,
        options: [
          { label: 'Item file column', value: 'column' },
          { label: 'Update', value: 'update' },
        ],
      },
    }),
    item_id: mondayAiProps.itemId(false),
    column_id: Property.ShortText({
      displayName: 'File Column ID',
      description: 'ID of a file-type column (required when Target is "column"). Resolve it with List Columns.',
      required: false,
    }),
    update_id: mondayAiProps.updateId(false),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name to store the file under, including extension. Defaults to the source file name.',
      required: false,
    }),
  },
  async run(context) {
    const { target, item_id, column_id, update_id, file, file_name } = context.propsValue;
    const fileName = file_name ?? file.filename;
    const fileBuffer = Buffer.from(file.base64, 'base64');

    if (target === 'update') {
      if (isNil(update_id)) {
        throw new Error('Update ID is required when Target is "update".');
      }
      const data = await mondayApi.uploadFile<{ add_file_to_update: MondayAsset }>({
        apiKey: context.auth.secret_text,
        query: `mutation ($updateId: ID!, $file: File!) {
          add_file_to_update(update_id: $updateId, file: $file) { ${ASSET_FIELDS} }
        }`,
        variables: { updateId: update_id },
        file: fileBuffer,
        fileName,
      });
      return toAssetRow({ asset: data.add_file_to_update, target, parentId: update_id });
    }

    if (isNil(item_id) || isNil(column_id)) {
      throw new Error('Item ID and File Column ID are required when Target is "column".');
    }
    const data = await mondayApi.uploadFile<{ add_file_to_column: MondayAsset }>({
      apiKey: context.auth.secret_text,
      query: `mutation ($itemId: ID!, $columnId: String!, $file: File!) {
        add_file_to_column(item_id: $itemId, column_id: $columnId, file: $file) { ${ASSET_FIELDS} }
      }`,
      variables: { itemId: item_id, columnId: column_id },
      file: fileBuffer,
      fileName,
    });
    return toAssetRow({ asset: data.add_file_to_column, target: 'column', parentId: item_id });
  },
});

function toAssetRow({ asset, target, parentId }: { asset: MondayAsset; target: string; parentId: string }) {
  return {
    id: asset.id,
    name: asset.name,
    url: asset.url,
    file_extension: asset.file_extension,
    file_size: asset.file_size,
    created_at: asset.created_at ?? null,
    target,
    target_id: parentId,
  };
}

const ASSET_FIELDS = 'id name url file_extension file_size created_at';

type MondayAsset = {
  id: string;
  name: string;
  url: string;
  file_extension: string;
  file_size: number;
  created_at: string | null;
};
