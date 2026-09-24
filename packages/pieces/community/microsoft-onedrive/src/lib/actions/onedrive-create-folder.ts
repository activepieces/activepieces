import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveCreateFolderOutputSchema } from '../output-schemas';

export const onedriveCreateFolder = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_create_folder',
  displayName: 'Create Folder',
  description: 'Create a folder in OneDrive, or return it if a folder with that name already exists.',
  audience: 'ai',
  outputSchema: onedriveCreateFolderOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Gets or creates a folder by name inside a parent folder (the drive root by default): if a folder with that name already exists it is returned with `created` false instead of making a duplicate. Call it before Upload File or Move File or Folder when the destination may not exist. It fails if a file (not a folder) already holds the name; safe to retry.',
    idempotent: true,
  },
  props: {
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the folder to create the new folder in, from Search Files and Folders or List Folder Contents. Leave empty for the drive root.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name of the folder, e.g. `Invoices 2026`. A single name, not a path.',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name.trim();
    if (!name) {
      throw new Error('Folder Name cannot be empty.');
    }
    const parentId = await oneDriveApi.resolveFolderId({
      auth: context.auth,
      folderId: context.propsValue.parentFolderId,
    });
    try {
      const created = await oneDriveApi.request<GraphDriveItem>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: `${oneDriveApi.itemPath({ itemId: parentId })}/children`,
        body: {
          name,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        },
      });
      return { ...oneDriveApi.toItem(created), created: true };
    } catch (createError) {
      if (oneDriveApi.statusOf(createError) !== 409) {
        throw createError;
      }
      const existing = await findChild({ auth: context.auth, parentId, name });
      if (!existing) {
        throw createError;
      }
      if (!existing.folder) {
        throw new Error(`A file named "${name}" already exists in this folder, so a folder with that name cannot be created.`);
      }
      return { ...oneDriveApi.toItem(existing), created: false };
    }
  },
});

async function findChild({
  auth,
  parentId,
  name,
}: {
  auth: OAuth2PropertyValue;
  parentId: string;
  name: string;
}): Promise<GraphDriveItem | null> {
  try {
    return await oneDriveApi.request<GraphDriveItem>({
      auth,
      method: HttpMethod.GET,
      path: `${oneDriveApi.itemPath({ itemId: parentId })}:/${encodeURIComponent(name)}:`,
    });
  } catch {
    return null;
  }
}
