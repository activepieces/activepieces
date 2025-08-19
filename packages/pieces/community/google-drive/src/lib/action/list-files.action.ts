import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import querystring from 'querystring';
import { common } from '../common';
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

  let q = `'${folderId}' in parents`;
  if (!includeTrashed) {
    q += ' and trashed=false';
  }

  const params: Record<string, string> = {
    q: q,
    fields: 'files(id,kind,mimeType,name,trashed,parents)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
  };

  let response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
    },
  });

  // Add files from current level
  for (const file of response.body.files) {
    files.push({
      file,
      level: currentLevel,
      parentFolder: folderId
    });
  }

  // Handle pagination for current level
  while (response.body.nextPageToken) {
    params.pageToken = response.body.nextPageToken;
    response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });
    
    for (const file of response.body.files) {
      files.push({
        file,
        level: currentLevel,
        parentFolder: folderId
      });
    }
  }

  // If we haven't reached max level, recursively get files from subfolders
  if (currentLevel + 1 < maxLevel) {
    const subfolders = files.filter(f => f.file.mimeType === 'application/vnd.google-apps.folder');
    
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

export const googleDriveListFiles = createAction({
  auth: googleDriveAuth,
  name: 'list-files',
  displayName: 'List files',
  description: 'List files from a Google Drive folder',
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
  async run(context) {
    const result: ListFilesResult = {
      type: 'drive#fileList',
      incompleteSearch: false,
      files: [],
    }

    const depthLevel = context.propsValue.depthLevel || 1;
    
    // Get files recursively based on depth level
    const filesWithLevel = await getFilesRecursively(
      context.auth,
      context.propsValue.folderId,
      depthLevel,
      context.propsValue.includeTrashed ?? false,
      context.propsValue.include_team_drives ?? false
    );

    // Extract just the file objects for backward compatibility
    result.files = filesWithLevel.map(f => f.file);

    // If downloadFiles is enabled, download each file and add URLs to array
    if (context.propsValue.downloadFiles) {
      const downloadedFiles: string[] = [];
      for (const fileWithLevel of filesWithLevel) {
        const file = fileWithLevel.file;
        // Skip folders when downloading
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          continue;
        }
        
        try {
          const fileUrl = await downloadFileFromDrive(
            context.auth,
            context.files,
            file.id,
            file.name
          );
          downloadedFiles.push(fileUrl);
        } catch (error) {
          console.warn(`Failed to download file ${file.name}: ${error instanceof Error ? error.message : 'Download failed'}`);
        }
      }
      result.downloadedFiles = downloadedFiles;
    }

    return result;
  }
});
