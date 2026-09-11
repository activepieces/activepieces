import querystring from 'querystring';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/pieces-framework';
import { GoogleDriveAuthValue, getAccessToken } from '../auth';

const PARENT_IDS_PER_QUERY = 50;

export async function getFilesByLevel({
  auth,
  rootFolderId,
  maxLevel,
  includeTrashed,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  rootFolderId: string;
  maxLevel: number;
  includeTrashed: boolean;
  includeTeamDrives: boolean;
}): Promise<FileWithLevel[]> {
  const filesWithLevel: FileWithLevel[] = [];
  let currentLevelParentIds = [rootFolderId];

  for (let level = 0; level < maxLevel && currentLevelParentIds.length > 0; level++) {
    const files = await fetchFilesForParents({
      auth,
      parentIds: currentLevelParentIds,
      includeTrashed,
      includeTeamDrives,
    });

    for (const file of files) {
      filesWithLevel.push({
        file,
        level,
        parentFolder: file.parents?.find((id: string) => currentLevelParentIds.includes(id)) ?? currentLevelParentIds[0],
      });
    }

    currentLevelParentIds = files
      .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
      .map(file => file.id);
  }

  return filesWithLevel;
}

async function fetchFilesForParents({
  auth,
  parentIds,
  includeTrashed,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  parentIds: string[];
  includeTrashed: boolean;
  includeTeamDrives: boolean;
}): Promise<any[]> {
  const accessToken = await getAccessToken(auth);
  const files: any[] = [];

  for (const parentIdsChunk of chunk(parentIds, PARENT_IDS_PER_QUERY)) {
    const parentsClause = parentIdsChunk.map(id => `'${id}' in parents`).join(' or ');
    const q = parentIdsChunk.length > 1 ? `(${parentsClause})` : parentsClause;

    const params: Record<string, string> = {
      q: includeTrashed ? q : `${q} and trashed=false`,
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

    files.push(...response.body.files);

    while (response.body.nextPageToken) {
      params.pageToken = response.body.nextPageToken;
      response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      files.push(...response.body.files);
    }
  }

  return files;
}

export interface FileWithLevel {
  file: any;
  level: number;
  parentFolder?: string;
}
