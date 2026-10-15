import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from './auth';
import { shortIoClient } from './client';
import { shortIoLinks } from './links';

const MAX_LINK_PAGES = 10;
const LINK_PAGE_SIZE = 150;

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const domainIdDropdown = Property.Dropdown({
  auth: shortIoAuth,
  displayName: 'Domain',
  description: 'Select the domain to use for the link',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Short.io account first' };
    }
    try {
      const domains = await shortIoLinks.listAllDomains(auth);
      return {
        disabled: false,
        options: domains.map((domain) => ({
          label: String(domain['hostname']),
          value: JSON.stringify({ id: domain['id'], hostname: domain['hostname'] }),
        })),
        placeholder: domains.length === 0 ? 'No domains available' : 'Select a domain',
      };
    } catch (error) {
      return { disabled: true, options: [], placeholder: `Error loading domains: ${errorText(error)}` };
    }
  },
});

export const linkIdDropdown = Property.Dropdown({
  auth: shortIoAuth,
  displayName: 'Short Link',
  description: 'Select the short link from the domain (the newest 1,500 links are listed).',
  required: true,
  refreshers: ['auth', 'domain'],
  options: async ({ auth, domain }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Short.io account first' };
    }
    if (!domain) {
      return { disabled: true, options: [], placeholder: 'Select a domain first' };
    }
    try {
      const domainRef = shortIoLinks.parseDomainProp(domain);
      const links: Record<string, unknown>[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_LINK_PAGES; page++) {
        const response = await shortIoClient.request({
          auth,
          method: HttpMethod.GET,
          path: '/api/links',
          query: { domain_id: domainRef.id, limit: LINK_PAGE_SIZE, dateSortOrder: 'desc', pageToken },
        });
        const record = shortIoLinks.isRecord(response) ? response : {};
        links.push(...shortIoLinks.scrubLinks(record['links']));
        pageToken = typeof record['nextPageToken'] === 'string' && record['nextPageToken'] ? record['nextPageToken'] : undefined;
        if (!pageToken) {
          break;
        }
      }
      return {
        disabled: false,
        options: links.map((link) => ({
          label: `${link['path'] || '(auto)'} → ${link['originalURL']}`,
          value: String(link['idString']),
        })),
        placeholder: links.length === 0 ? 'No links available' : pageToken ? 'Select a link (older links: use Link ID in an AI step or List Links)' : 'Select a link',
      };
    } catch (error) {
      return { disabled: true, options: [], placeholder: `Error loading links: ${errorText(error)}` };
    }
  },
});

export const folderIdDropdown = Property.Dropdown({
  auth: shortIoAuth,
  displayName: 'Folder',
  description: 'Select the folder to add the link to.',
  required: false,
  refreshers: ['auth', 'domain'],
  options: async ({ auth, domain }) => {
    if (!auth || !domain) {
      return { disabled: true, options: [], placeholder: 'Select a domain first' };
    }
    try {
      const domainRef = shortIoLinks.parseDomainProp(domain);
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/links/folders/${shortIoClient.domainIdSeg(domainRef.id)}`,
      });
      const folders = shortIoLinks.isRecord(response) && Array.isArray(response['linkFolders']) ? response['linkFolders'].filter(shortIoLinks.isRecord) : [];
      if (folders.length === 0) {
        return { disabled: true, options: [], placeholder: 'No folders found in this domain' };
      }
      return {
        disabled: false,
        options: folders.map((folder) => ({ label: String(folder['name']), value: String(folder['id']) })),
        placeholder: 'Select a folder',
      };
    } catch (error) {
      return { disabled: true, options: [], placeholder: `Error: Could not load folders. ${errorText(error)}` };
    }
  },
});
