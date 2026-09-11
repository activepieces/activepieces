import { extension } from 'mime-types';
import { googleDriveAuth } from '../auth';
import { Property, createAction } from "@activepieces/pieces-framework";
import { common } from '../common';
import { listDriveFilesRecursive } from '../common/list-drive-files';
import { downloadFileFromDrive } from '../common/get-file-content';
import { listFilesActionOutputSchema } from '../output-schemas';

interface ListFilesResult {
  type: string;
  incompleteSearch: boolean;
  files: unknown[];
  downloadedFiles?: string[];
}

export const googleDriveListFiles = createAction({
  auth: googleDriveAuth,
  name: 'list-files',
  classification: 'SEARCH',
  displayName: 'List files',
  description: 'List files from a Google Drive folder',
  audience: 'human',
  aiMetadata: { description: 'Lists files and subfolders inside a given Drive folder, with optional recursion to a chosen depth and optional download of each file\'s content. Use to enumerate the contents of a known folder ID. Read-only and idempotent. Requires the folder ID, not a name.', idempotent: true },
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Folder ID coming from | New Folder -> id | (or any other source)',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
    
    includeTrashed: Property.Checkbox({
      displayName: 'Include Trashed',
      description: 'Include new files that have been trashed.',
      required: false,
      defaultValue: false
    }),

    depthLevel: Property.Number({
      displayName: 'Depth Level',
      description: 'How many levels deep to search for files. 1 = current folder only, 2 = current + next level, etc.',
      required: false,
      defaultValue: 1
    }),

    downloadFiles: Property.Checkbox({
      displayName: 'Download Files',
      description: 'Download all file contents in a list',
      required: false,
      defaultValue: false
    }),
  },
  outputSchema: listFilesActionOutputSchema,
  async run(context) {
    const result: ListFilesResult = {
      type: 'drive#fileList',
      incompleteSearch: false,
      files: [],
    }

    const depthLevel = context.propsValue.depthLevel || 1;
    
    // Get files level-by-level, batching all folders at a level into as few queries as possible
    const filesWithLevel = await listDriveFilesRecursive({
      auth: context.auth,
      rootFolderId: context.propsValue.folderId,
      maxLevel: depthLevel,
      includeTrashed: context.propsValue.includeTrashed ?? false,
      includeTeamDrives: context.propsValue.include_team_drives ?? false,
    });

    // If downloadFiles is enabled, download each file and return a new file object carrying the URL
    if (context.propsValue.downloadFiles) {
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
        if (correctExtension && !safeName.toLowerCase().endsWith(`.${correctExtension}`)) {
            // Check for the .jpeg edge case before appending .jpg
            if (!(file.mimeType === 'image/jpeg' && safeName.toLowerCase().endsWith('.jpeg'))) {
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
          console.warn(`Failed to download file ${file.name}: ${error instanceof Error ? error.message : 'Download failed'}`);
          processedFiles.push(file);
        }
      }

      result.files = processedFiles;
      // Kept for backward compatibility; each URL now also lives on its file's `downloadedFile`
      result.downloadedFiles = processedFiles
        .map(f => f.downloadedFile)
        .filter((url): url is string => url !== undefined);
    } else {
      result.files = filesWithLevel.map(f => f.file);
    }

    return result;
  }
});
