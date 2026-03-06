import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { getPCloudBaseUrl } from '../auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PCloudItem {
  fileid?: number;
  folderid?: number;
  name: string;
  path: string;
  parentfolderid: number;
  created: string;
  modified: string;
  ismine: boolean;
  isshared: boolean;
  isfolder: boolean;
  size?: number;
  contenttype?: string;
  icon?: string;
}

export interface PCloudListFolderResponse {
  result: number;
  metadata: {
    folderid: number;
    name: string;
    path: string;
    contents: PCloudItem[];
  };
}

export interface PCloudUploadResponse {
  result: number;
  fileids: number[];
  metadata: PCloudItem[];
}

export interface PCloudCreateFolderResponse {
  result: number;
  metadata: PCloudItem;
}

export interface PCloudCopyFileResponse {
  result: number;
  metadata: PCloudItem;
}

export interface PCloudFileLinkResponse {
  result: number;
  path: string;
  expires: string;
  hosts: string[];
}

export interface PCloudUserInfoResponse {
  result: number;
  userid: number;
  email: string;
  emailverified: boolean;
  registered: string;
  premium: boolean;
  quota: number;
  usedquota: number;
}

// ---------------------------------------------------------------------------
// Shared dropdown properties
// ---------------------------------------------------------------------------

export const pCloudFolderIdProp = Property.Dropdown({
  displayName: 'Folder',
  description: 'Select a folder. Leave blank for root.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your pCloud account first.' };
    }
    const authValue = auth as OAuth2PropertyValue;
    const baseUrl = getPCloudBaseUrl(authValue as unknown as { data?: Record<string, unknown> });

    try {
      const response = await httpClient.sendRequest<PCloudListFolderResponse>({
        method: HttpMethod.GET,
        url: `${baseUrl}/listfolder`,
        queryParams: {
          folderid: '0',
          recursive: '1',
          nofiles: '1',
        },
        headers: {
          Authorization: `Bearer ${authValue.access_token}`,
        },
      });

      const options: { label: string; value: string }[] = [
        { label: '/ (Root)', value: '0' },
      ];

      function collectFolders(items: PCloudItem[], depth = 0): void {
        for (const item of items) {
          if (item.isfolder) {
            const indent = '  '.repeat(depth);
            options.push({
              label: `${indent}${item.name}`,
              value: String(item.folderid),
            });
          }
        }
      }

      if (response.body?.metadata?.contents) {
        collectFolders(response.body.metadata.contents);
      }

      return { options };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load folders.' };
    }
  },
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Build a pCloud download URL from a getfilelink response.
 */
export function buildDownloadUrl(linkResponse: PCloudFileLinkResponse): string {
  const host = linkResponse.hosts[0];
  return `https://${host}${linkResponse.path}`;
}

/**
 * Fetch the list of items in a folder, optionally recursive.
 */
export async function listFolder(
  auth: OAuth2PropertyValue,
  folderId: string | number,
  recursive = false
): Promise<PCloudItem[]> {
  const baseUrl = getPCloudBaseUrl(auth as unknown as { data?: Record<string, unknown> });
  const response = await httpClient.sendRequest<PCloudListFolderResponse>({
    method: HttpMethod.GET,
    url: `${baseUrl}/listfolder`,
    queryParams: {
      folderid: String(folderId),
      recursive: recursive ? '1' : '0',
    },
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
    },
  });

  if (response.body.result !== 0) {
    throw new Error(`pCloud listfolder error: ${response.body.result}`);
  }

  return response.body.metadata.contents ?? [];
}

/**
 * Recursively search for files/folders by name within a folder.
 */
export async function searchItems(
  auth: OAuth2PropertyValue,
  folderId: string | number,
  query: string,
  searchType: 'all' | 'files' | 'folders' = 'all'
): Promise<PCloudItem[]> {
  const allItems = await listFolder(auth, folderId, true);
  const queryLower = query.toLowerCase();

  return allItems.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(queryLower);
    if (!nameMatch) return false;
    if (searchType === 'files') return !item.isfolder;
    if (searchType === 'folders') return item.isfolder;
    return true;
  });
}

/**
 * Get recent items created after a given timestamp (ISO string).
 */
export async function getRecentItems(
  auth: OAuth2PropertyValue,
  folderId: string | number,
  afterTimestamp: string | undefined,
  type: 'files' | 'folders'
): Promise<PCloudItem[]> {
  const allItems = await listFolder(auth, folderId, true);

  return allItems.filter((item) => {
    if (type === 'files' && item.isfolder) return false;
    if (type === 'folders' && !item.isfolder) return false;

    if (afterTimestamp) {
      const createdAt = new Date(item.created).getTime();
      const after = new Date(afterTimestamp).getTime();
      return createdAt > after;
    }

    return true;
  });
}
