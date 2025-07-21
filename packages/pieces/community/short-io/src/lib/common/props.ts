import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoApiCall, ShortioAuthProps } from './client';

interface ShortIoDomain {
  id: number;
  hostname: string;
}

interface ShortIoLink {
  idString: string;
  path: string;
  originalURL: string;
}

interface ShortIoLinksResponse {
  links: ShortIoLink[];
}

interface ShortIoFolder {
  id: string;
  name: string;
}

interface ShortIoFoldersResponse {
  linkFolders: ShortIoFolder[];
}

export const domainIdDropdown = Property.Dropdown({
  displayName: 'Domain',
  description: 'Select the domain to use for the link',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Short.io account first',
      };
    }

    try {
      const domains = await shortIoApiCall<ShortIoDomain[]>({
        auth: auth as ShortioAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/api/domains',
      });

      return {
        disabled: false,
        options: domains.map((domain) => ({
          label: domain.hostname,
          value: JSON.stringify({
            id: domain.id,
            hostname: domain.hostname,
          }),
        })),
        placeholder:
          domains.length === 0 ? 'No domains available' : 'Select a domain',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading domains: ${error.message}`,
      };
    }
  },
});

export const linkIdDropdown = Property.Dropdown({
  displayName: 'Short Link',
  description: 'Select the short link from the domain',
  required: true,
  refreshers: ['auth', 'domain'],
  options: async ({ auth, domain }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Short.io account first',
      };
    }

    if (!domain) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a domain first',
      };
    }

    try {
      const domainObject = JSON.parse(domain as string);
      const response = await shortIoApiCall<ShortIoLinksResponse>({
        auth: auth as ShortioAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/api/links',
        query: {
          domain_id: domainObject.id,
          limit: 100,
        },
      });

      return {
        disabled: false,
        options: response.links.map((link) => ({
          label: `${link.path || '(auto)'} → ${link.originalURL}`,
          value: link.idString,
        })),
        placeholder:
          response.links.length === 0 ? 'No links available' : 'Select a link',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading links: ${error.message}`,
      };
    }
  },
});

export const folderIdDropdown = Property.Dropdown({
  displayName: 'Folder',
  description: 'Select the folder to add the link to.',
  required: false,
  refreshers: ['auth', 'domain'],
  options: async ({ auth, domain }) => {
    if (!auth || !domain) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a domain first',
      };
    }

    try {
      const domainObject = JSON.parse(domain as string);
      const response = await shortIoApiCall<ShortIoFoldersResponse>({
        auth: auth as ShortioAuthProps,
        method: HttpMethod.GET,
        resourceUri: `/links/folders/${domainObject.id}`,
      });

      const foldersArray = response.linkFolders;

      if (!foldersArray || foldersArray.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No folders found in this domain',
        };
      }

      return {
        disabled: false,
        options: foldersArray.map((folder: ShortIoFolder) => ({
          label: folder.name,
          value: folder.id,
        })),
        placeholder: 'Select a folder',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error: Could not load folders. ${error.message}`,
      };
    }
  },
});
