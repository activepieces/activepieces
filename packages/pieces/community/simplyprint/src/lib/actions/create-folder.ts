import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const createFolderAction = createAction({
  auth: simplyprintAuth,
  name: 'create_folder',
  displayName: 'Create or Update Folder',
  description:
    'Create a new folder in the user file system, or update an existing one (pass the folder ID to edit). Optionally an "organization" / shared folder with per-rank view/upload/modify permissions.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a folder in the user file system, or edits an existing one when a folder ID is supplied (the mode is chosen by whether that ID is present). Can mark it a shared "organization" folder with per-rank view/upload/modify permissions (requires the Shared Folders feature). Requires a name and parent folder ID (0 for root). Not idempotent in create mode: each call without a folder ID makes a new folder; edit mode keyed on a folder ID is idempotent.',
    idempotent: false,
  },
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID (edit existing)',
      description: 'Numeric ID of the folder to edit. Omit to create a new folder.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Folder name',
      description: 'Display name (max 128 chars).',
      required: true,
    }),
    parentFolder: Property.Number({
      displayName: 'Parent folder ID',
      description: 'Numeric ID of the parent folder. Use 0 for root.',
      required: true,
      defaultValue: 0,
    }),
    org: Property.Checkbox({
      displayName: 'Shared (organization) folder',
      description: 'When true, the folder is shared across the company per the rank-based permissions below. Requires the Shared Folders feature.',
      required: false,
      defaultValue: false,
    }),
    viewRanks: Property.Array({
      displayName: 'View — user rank IDs',
      description: 'Only used when "Shared folder" is true. Numeric user rank IDs allowed to view the folder.',
      required: false,
    }),
    uploadRanks: Property.Array({
      displayName: 'Upload — user rank IDs',
      description: 'Only used when "Shared folder" is true. Numeric user rank IDs allowed to upload to the folder.',
      required: false,
    }),
    modifyRanks: Property.Array({
      displayName: 'Modify — user rank IDs',
      description: 'Only used when "Shared folder" is true. Numeric user rank IDs allowed to modify / delete contents.',
      required: false,
    }),
  },
  async run(context) {
    const v = context.propsValue;
    const body: Record<string, unknown> = {
      name: v.name,
      parent_folder: v.parentFolder ?? 0,
    };
    if (v.org) {
      body['org'] = true;
      const ints = (a: unknown) => ((a as unknown[] | undefined) ?? []).map(Number).filter((n) => n > 0);
      body['org_perms'] = {
        view: ints(v.viewRanks),
        upload: ints(v.uploadRanks),
        modify: ints(v.modifyRanks),
      };
    }

    const queryParams: Record<string, string> = {};
    if (typeof v.folderId === 'number' && v.folderId > 0) {
      queryParams['id'] = String(v.folderId);
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'files/CreateFolder',
      queryParams,
      body,
    });
  },
});
