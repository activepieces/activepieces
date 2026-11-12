import querystring from 'querystring';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { GoogleDriveAuthValue, createGoogleClient, getAccessToken } from '../auth';
import { common } from './index';

export async function listDriveFiles<T = DriveTreeItem>({
  auth,
  params,
}: {
  auth: GoogleDriveAuthValue;
  params: Record<string, string>;
}): Promise<T[]> {
  const listing = await listDriveFilesWithStatus<T>({ auth, params });
  if (listing.incompleteSearch) {
    throw new Error(
      'Google Drive could not search every file in this folder. Try again, or turn off Include Team Drives.'
    );
  }
  return listing.files;
}

export async function resolveFolderScope({
  auth,
  folderId,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  folderId: string;
  includeTeamDrives: boolean;
}): Promise<Record<string, string>> {
  if (!includeTeamDrives) {
    return {
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'false',
      corpora: 'user',
    };
  }
  const drive = googleDrive({
    version: 'v3',
    auth: await createGoogleClient(auth),
  });
  const folder = await drive.files.get({
    fileId: folderId,
    fields: 'id, driveId',
    supportsAllDrives: true,
  });
  const driveId = folder.data.driveId;
  return driveId
    ? {
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        corpora: 'drive',
        driveId,
      }
    : {
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        corpora: 'user',
      };
}

export async function listDriveFilesRecursive({
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
}): Promise<{ files: DriveTreeItem[]; incompleteSearch: boolean }> {
  const scope = await resolveFolderScope({
    auth,
    folderId: rootFolderId,
    includeTeamDrives,
  });
  const files: DriveTreeItem[] = [];
  let incompleteSearch = false;
  let currentLevelParentIds = [rootFolderId];

  for (let level = 0; level < maxLevel && currentLevelParentIds.length > 0; level++) {
    const nextLevelParentIds: string[] = [];

    for (const parentIdsChunk of chunk(currentLevelParentIds, PARENT_IDS_PER_QUERY)) {
      const parentsClause = parentIdsChunk.map(id => `'${common.escapeDriveQueryLiteral(id)}' in parents`).join(' or ');
      const q = parentIdsChunk.length > 1 ? `(${parentsClause})` : parentsClause;

      const page = await listDriveFilesWithStatus<DriveTreeItem>({
        auth,
        params: {
          q: includeTrashed ? q : `${q} and trashed=false`,
          fields: 'nextPageToken,incompleteSearch,files(id,kind,mimeType,name,trashed,parents)',
          ...scope,
          pageSize: '1000',
        },
      });
      incompleteSearch = incompleteSearch || page.incompleteSearch;

      for (const file of page.files) {
        files.push(file);

        if (file.mimeType === 'application/vnd.google-apps.folder') {
          nextLevelParentIds.push(file.id);
        }
      }
    }

    currentLevelParentIds = nextLevelParentIds;
  }

  return { files, incompleteSearch };
}

async function listDriveFilesWithStatus<T>({
  auth,
  params,
}: {
  auth: GoogleDriveAuthValue;
  params: Record<string, string>;
}): Promise<{ files: T[]; incompleteSearch: boolean }> {
  const accessToken = await getAccessToken(auth);
  const fields = params['fields'];
  const requestParams =
    fields && !fields.includes('incompleteSearch')
      ? { ...params, fields: `incompleteSearch,${fields}` }
      : params;
  const files: T[] = [];
  let incompleteSearch = false;

  let pageToken: string | undefined;
  do {
    const pageParams = pageToken ? { ...requestParams, pageToken } : requestParams;
    const response = await httpClient.sendRequest<{
      files?: T[];
      nextPageToken?: string;
      incompleteSearch?: boolean;
    }>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(pageParams)}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    files.push(...(response.body.files ?? []));
    incompleteSearch = incompleteSearch || response.body.incompleteSearch === true;
    pageToken = response.body.nextPageToken;
  } while (pageToken);

  return { files, incompleteSearch };
}

const PARENT_IDS_PER_QUERY = 50;

export type DriveTreeItem = {
  id: string;
  name: string;
  mimeType: string;
  kind?: string;
  trashed?: boolean;
  parents?: string[];
};
