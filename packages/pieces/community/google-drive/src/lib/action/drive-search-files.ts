import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { common } from '../common';
import {
  buildDriveSearchQuery,
  DRIVE_SEARCH_FIELD_CHOICES,
  DRIVE_SEARCH_OPERATOR_CHOICES,
  DriveSearchFieldChoice,
  DriveSearchOperatorChoice,
} from '../common/search-query';
import { driveSearchFilesOutputSchema } from '../output-schemas';

const FIELD_LABELS: Record<DriveSearchFieldChoice, string> = {
  name: 'File name',
  fullText: 'Full text search',
  mimeType: 'Content type',
};

const OPERATOR_LABELS: Record<DriveSearchOperatorChoice, string> = {
  contains: 'Contains',
  '=': 'Equals',
};

export const driveSearchFiles = createAction({
  auth: googleDriveAuth,
  name: 'drive_search_files',
  classification: 'SEARCH',
  displayName: 'Search Files and Folders',
  description: 'Search a Google Drive folder for files/sub-folders',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Drive for files or folders matching a name, full-text, or MIME-type query, optionally scoped to a parent folder. Use this to resolve a human-readable name into a file/folder ID before acting on it; to list a known folder\'s children use `drive_list_files` instead. Read-only.',
    idempotent: true,
  },
  outputSchema: driveSearchFilesOutputSchema,
  props: {
    query_term: Property.StaticDropdown({
      displayName: 'Query Term',
      description: 'The Query term or field of file/folder to search upon.',
      defaultValue: 'name',
      options: {
        options: DRIVE_SEARCH_FIELD_CHOICES.map((value): DropdownChoice => ({
          label: FIELD_LABELS[value],
          value,
        })),
      },
      required: true,
    }),
    operator: Property.StaticDropdown({
      displayName: 'Operator',
      description: 'The operator to create criteria.',
      required: true,
      options: {
        options: DRIVE_SEARCH_OPERATOR_CHOICES.map((value): DropdownChoice => ({
          label: OPERATOR_LABELS[value],
          value,
        })),
      },
      defaultValue: 'contains',
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Value of the field of file/folder to search for.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'File Type',
      description: '(Optional) Choose between files and folders.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Files', value: 'file' },
          { label: 'Folders', value: 'folder' },
        ],
      },
      defaultValue: 'all',
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        '(Optional) Restrict the search to files/folders inside this folder ID.',
      required: false,
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description:
        'Determines if folders from Team Drives should be included in the results.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });
    const finalQuery = buildDriveSearchQuery({
      queryTerm: context.propsValue.query_term ?? 'name',
      operator: context.propsValue.operator ?? 'contains',
      query: context.propsValue.value,
      parentFolder: context.propsValue.parent_folder_id,
      type: context.propsValue.type ?? 'all',
    });

    const listing = await common.listFilesAcrossCorpora({
      drive,
      params: {
        q: finalQuery,
        fields:
          'nextPageToken, incompleteSearch, files(id, name, mimeType, createdTime, modifiedTime)',
        includeItemsFromAllDrives: context.propsValue.include_team_drives ?? false,
        supportsAllDrives: true,
        corpora: context.propsValue.include_team_drives ? 'allDrives' : 'user',
        pageSize: 1000,
      },
      maxPages: undefined,
      deadline: Date.now() + common.actionListingBudgetMs,
      wording: 'action',
    });
    return listing.files;
  },
});

type DropdownChoice = { label: string; value: string };
