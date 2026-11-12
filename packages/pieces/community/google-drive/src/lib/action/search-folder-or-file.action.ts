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
import { searchFolderActionOutputSchema } from '../output-schemas';

const FIELD_LABELS: Record<DriveSearchFieldChoice, string> = {
  name: 'File Name',
  fullText: 'Text Inside the File',
  mimeType: 'File Type',
};

const OPERATOR_CARDS: Record<
  DriveSearchOperatorChoice,
  { label: string; description: string; icon: string }
> = {
  contains: { label: 'Contains', description: 'Partial match', icon: 'filter' },
  '=': { label: 'Equals', description: 'Exact match', icon: 'tag' },
};

export const googleDriveSearchFolder = createAction({
  auth: googleDriveAuth,
  name: 'search-folder',
  classification: 'SEARCH',
  displayName: 'Find File or Folder',
  description: 'Find files or folders by name, content or type.',
  audience: 'human',
  aiMetadata: { description: 'Searches Google Drive for files or folders matching a name, full-text, or MIME-type query, optionally scoped to a parent folder and filtered to files or folders only. Use to resolve a file/folder ID from a human-readable name before acting on it. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search for',
      icon: 'type',
      props: ['queryTerm', 'operator', 'query'],
    },
    {
      key: 'scope',
      display: 'section',
      label: 'Limit results',
      icon: 'sliders',
      props: ['type', 'parentFolder', 'include_team_drives'],
    },
  ],
  props: {
    queryTerm: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Match the file name, the text inside it, or its type.',
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
      displayName: 'Match',
      description: 'Contains finds partial matches; Equals needs the exact value.',
      required: true,
      display: 'cards',
      options: {
        options: DRIVE_SEARCH_OPERATOR_CHOICES.map((value): DropdownChoice => ({
          ...OPERATOR_CARDS[value],
          value,
        })),
      },
      defaultValue: 'contains',
    }),
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'The name, text or type to look for.',
      required: true,
      placeholder: 'Quarterly report',
    }),
    type: Property.StaticDropdown({
      displayName: 'Show',
      description: 'Return everything, only files or only folders.',
      required: false,
      options: {
        options: [
          { label: 'Files and Folders', value: 'all' },
          { label: 'Files Only', value: 'file' },
          { label: 'Folders Only', value: 'folder' },
        ],
      },
      defaultValue: 'all',
    }),
    parentFolder: common.parentFolderDropdown({
      displayName: 'Search in Folder',
      description: 'Leave empty to search all of Drive. Type to search by folder name.',
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: searchFolderActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });
    const finalQuery = buildDriveSearchQuery({
      queryTerm: context.propsValue.queryTerm ?? 'name',
      operator: context.propsValue.operator ?? 'contains',
      query: context.propsValue.query,
      parentFolder: context.propsValue.parentFolder,
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

type DropdownChoice = {
  label: string;
  value: string;
  description?: string;
  icon?: string;
};
