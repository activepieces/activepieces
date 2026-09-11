import { extension } from 'mime-types';
import { googleDriveAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { listDriveFilesRecursive } from '../common/list-drive-files';
import { downloadFileFromDrive } from '../common/get-file-content';
import { driveListFilesOutputSchema } from '../output-schemas';

interface ListFilesResult {
  type: string;
  incompleteSearch: boolean;
  files: unknown[];
  downloadedFiles?: string[];
}

export const driveListFiles = createAction({
  auth: googleDriveAuth,
  name: 'drive_list_files',
  classification: 'SEARCH',
  displayName: 'List Folder Contents',
  description: 'List files from a Google Drive folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists files and subfolders inside a given folder ID, optionally recursing to a chosen depth and downloading each file\'s content. Use to enumerate the contents of a known folder; to find a file by name across Drive use `drive_search_files`. Read-only. Requires the folder ID, not a name.',
    idempotent: true,
  },
  outputSchema: driveListFilesOutputSchema,
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The ID of the folder to list. Resolve it via `drive_search_files` (or any other source).',
      required: true,
    }),
    include_trashed: Property.Checkbox({
      displayName: 'Include Trashed',
      description: 'Include new files that have been trashed.',
      required: false,
      defaultValue: false,
    }),
    depth_level: Property.Number({
      displayName: 'Depth Level',
      description:
        'How many levels deep to search for files. 1 = current folder only, 2 = current + next level, etc.',
      required: false,
      defaultValue: 1,
    }),
    download_files: Property.Checkbox({
      displayName: 'Download Files',
      description: 'Download all file contents in a list',
      required: false,
      defaultValue: false,
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
    const result: ListFilesResult = {
      type: 'drive#fileList',
      incompleteSearch: false,
      files: [],
    };

    const depthLevel = context.propsValue.depth_level || 1;

    // Get files level-by-level, batching all folders at a level into as few queries as possible
    const filesWithLevel = await listDriveFilesRecursive({
      auth: context.auth,
      rootFolderId: context.propsValue.folder_id,
      maxLevel: depthLevel,
      includeTrashed: context.propsValue.include_trashed ?? false,
      includeTeamDrives: context.propsValue.include_team_drives ?? false,
    });

    // If downloadFiles is enabled, download each file and return a new file object carrying the URL
    if (context.propsValue.download_files) {
      const processedFiles: any[] = [];

      for (const fileWithLevel of filesWithLevel) {
        const file = fileWithLevel.file;
        // Skip folders when downloading
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          processedFiles.push(file);
          continue;
        }

        let safeName = file.name;
        const correctExtension = extension(file.mimeType);
        if (
          correctExtension &&
          !safeName.toLowerCase().endsWith(`.${correctExtension}`)
        ) {
          // Check for the .jpeg edge case before appending .jpg
          if (
            !(
              file.mimeType === 'image/jpeg' &&
              safeName.toLowerCase().endsWith('.jpeg')
            )
          ) {
            safeName = `${safeName}.${correctExtension}`;
          }
        }

        try {
          const downloadedFile = await downloadFileFromDrive(
            context.auth,
            context.files,
            file.id,
            safeName
          );
          processedFiles.push({ ...file, downloadedFile });
        } catch (error) {
          console.warn(
            `Failed to download file ${file.name}: ${
              error instanceof Error ? error.message : 'Download failed'
            }`
          );
          processedFiles.push(file);
        }
      }

      result.files = processedFiles;
      // Kept for backward compatibility; each URL now also lives on its file's `downloadedFile`
      result.downloadedFiles = processedFiles
        .map((f) => f.downloadedFile)
        .filter((url): url is string => url !== undefined);
    } else {
      result.files = filesWithLevel.map((f) => f.file);
    }

    return result;
  },
});
