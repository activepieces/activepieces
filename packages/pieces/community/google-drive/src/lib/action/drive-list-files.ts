import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleDriveAuth, getAccessToken } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import querystring from 'querystring';
import { downloadFileFromDrive } from '../common/get-file-content';

interface ListFilesResult {
  type: string;
  incompleteSearch: boolean;
  files: unknown[];
  downloadedFiles?: string[];
}

interface FileWithLevel {
  file: any;
  level: number;
  parentFolder?: string;
}

async function getFilesRecursively(
  auth: any,
  folderId: string,
  maxLevel: number,
  includeTrashed: boolean,
  includeTeamDrives: boolean,
  currentLevel = 0
): Promise<FileWithLevel[]> {
  const files: FileWithLevel[] = [];

  if (currentLevel > maxLevel) {
    return files;
  }

  const accessToken = await getAccessToken(auth);

  let q = `'${folderId}' in parents`;
  if (!includeTrashed) {
    q += ' and trashed=false';
  }

  const params: Record<string, string> = {
    q: q,
    fields: 'nextPageToken,files(id,kind,mimeType,name,trashed,parents)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
    corpora: includeTeamDrives ? 'allDrives' : 'user',
    pageSize: '1000',
  };

  let response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Add files from current level
  for (const file of response.body.files) {
    files.push({
      file,
      level: currentLevel,
      parentFolder: folderId,
    });
  }

  // Handle pagination for current level
  while (response.body.nextPageToken) {
    params.pageToken = response.body.nextPageToken;
    response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    for (const file of response.body.files) {
      files.push({
        file,
        level: currentLevel,
        parentFolder: folderId,
      });
    }
  }

  // If we haven't reached max level, recursively get files from subfolders
  if (currentLevel + 1 < maxLevel) {
    const subfolders = files.filter(
      (f) => f.file.mimeType === 'application/vnd.google-apps.folder'
    );

    for (const subfolder of subfolders) {
      const subfolderFiles = await getFilesRecursively(
        auth,
        subfolder.file.id,
        maxLevel,
        includeTrashed,
        includeTeamDrives,
        currentLevel + 1
      );
      files.push(...subfolderFiles);
    }
  }

  return files;
}

export const driveListFiles = createAction({
  auth: googleDriveAuth,
  name: 'drive_list_files',
  displayName: 'List Folder Contents',
  description: 'List files from a Google Drive folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists files and subfolders inside a given folder ID, optionally recursing to a chosen depth and downloading each file\'s content. Use to enumerate the contents of a known folder; to find a file by name across Drive use `drive_search_files`. Read-only. Requires the folder ID, not a name.',
    idempotent: true,
  },
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

    // Get files recursively based on depth level
    const filesWithLevel = await getFilesRecursively(
      context.auth,
      context.propsValue.folder_id,
      depthLevel,
      context.propsValue.include_trashed ?? false,
      context.propsValue.include_team_drives ?? false
    );

    // Extract just the file objects for backward compatibility
    result.files = filesWithLevel.map((f) => f.file);

    // If downloadFiles is enabled, download each file and add URLs to array
    if (context.propsValue.download_files) {
      const downloadedFiles: string[] = [];
      const extensionMap: Record<string, string> = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/tiff': '.tiff',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          '.docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          '.xlsx',
      };

      for (const fileWithLevel of filesWithLevel) {
        const file = fileWithLevel.file;
        // Skip folders when downloading
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          continue;
        }

        let safeName = file.name;
        const correctExtension = extensionMap[file.mimeType];
        if (
          correctExtension &&
          !safeName.toLowerCase().endsWith(correctExtension)
        ) {
          // Check for the .jpeg edge case before appending .jpg
          if (
            !(
              file.mimeType === 'image/jpeg' &&
              safeName.toLowerCase().endsWith('.jpeg')
            )
          ) {
            safeName = safeName + correctExtension;
          }
        }

        try {
          const fileUrl = await downloadFileFromDrive(
            context.auth,
            context.files,
            file.id,
            safeName
          );
          downloadedFiles.push(fileUrl);
        } catch (error) {
          console.warn(
            `Failed to download file ${file.name}: ${
              error instanceof Error ? error.message : 'Download failed'
            }`
          );
        }
      }
      result.downloadedFiles = downloadedFiles;
    }

    return result;
  },
});
