import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bitlyApiCall, BitlyAuthProps, requireGuid } from './client';
import { bitlyAuth } from './auth';
import { BitlyGroup, BitlyLink, BitlyPagination } from './schemas';

export const groupGuid = Property.Dropdown({
  displayName: 'Group',
  description: 'The group where the item will be managed.',
  required: true,
  refreshers: [],
  auth: bitlyAuth,
  options: async ({ auth }) => {
    if (!auth || !auth.props.accessToken) {
      return { disabled: true, options: [], placeholder: 'Please connect your Bitly account first.' };
    }
    try {
      const groups = await getBitlyGroups({ accessToken: auth.props.accessToken });
      if (groups.length === 0) {
        return { disabled: true, options: [], placeholder: 'No groups found in your account.' };
      }
      return {
        disabled: false,
        options: groups.map((group) => ({ label: group.name, value: group.guid })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: `Error fetching groups: ${errorText(e)}` };
    }
  },
});

export const domain = Property.Dropdown({
  auth: bitlyAuth,
  displayName: 'Domain',
  description: 'Domain to use for the Bitlink.',
  required: false,
  refreshers: ['group_guid'],
  options: async ({ auth, group_guid }) => {
    if (!auth || !auth.props.accessToken) {
      return { disabled: true, options: [], placeholder: 'Please connect your Bitly account first.' };
    }
    if (typeof group_guid !== 'string' || group_guid === '') {
      return { disabled: true, options: [], placeholder: 'Please select a group first.' };
    }
    try {
      const groups = await getBitlyGroups({ accessToken: auth.props.accessToken });
      const selectedGroup = groups.find((g) => g.guid === group_guid);
      const customDomains = brandedDomains(selectedGroup?.bsds);
      const allDomains = ['bit.ly', ...customDomains.filter((d) => d !== 'bit.ly')];
      return {
        disabled: false,
        options: allDomains.map((d) => ({ label: d, value: d })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: `Error fetching domains: ${errorText(e)}` };
    }
  },
});

export const bitlinkDropdown = Property.Dropdown({
  displayName: 'Bitlink',
  description: 'Select the Bitlink. Lists up to the 1,000 most recent Bitlinks; map a Bitlink ID (e.g. bit.ly/abc123) for older ones.',
  required: true,
  refreshers: ['group_guid'],
  auth: bitlyAuth,
  options: async ({ auth, group_guid }) => {
    if (!auth || !auth.props.accessToken) {
      return { disabled: true, options: [], placeholder: 'Please connect your Bitly account first.' };
    }
    if (typeof group_guid !== 'string' || group_guid === '') {
      return { disabled: true, options: [], placeholder: 'Please select a group first.' };
    }
    try {
      const links = await listRecentBitlinks({
        auth: { accessToken: auth.props.accessToken },
        groupGuid: group_guid,
      });
      return {
        disabled: false,
        options: links.map((link) => ({
          label: `${link.title || 'No Title'} (${link.id})${link.archived ? ' - archived' : ''}`,
          value: link.id,
        })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: `Error fetching Bitlinks: ${errorText(e)}` };
    }
  },
});

export function parseTriState({ value, label }: { value: unknown; label: string }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'yes' || value === 'true') {
    return true;
  }
  if (value === false || value === 'no' || value === 'false') {
    return false;
  }
  throw new Error(`${label} must be "yes" or "no".`);
}

export function toStringList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const raw = Array.isArray(value) ? value : String(value).split(',');
  return raw
    .filter((item) => item !== undefined && item !== null)
    .map((item) => String(item).trim())
    .filter((item) => item !== '');
}

export function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export async function getBitlyGroups(auth: BitlyAuthProps): Promise<BitlyGroup[]> {
  const response = await bitlyApiCall<{ groups?: BitlyGroup[] }>({
    auth,
    method: HttpMethod.GET,
    resourceUri: '/groups',
    operation: 'list groups',
  });
  return response.groups ?? [];
}

export function brandedDomains(bsds: unknown[] | undefined): string[] {
  if (!bsds) {
    return [];
  }
  return bsds.flatMap((bsd) => {
    if (typeof bsd === 'string') {
      return [bsd];
    }
    if (typeof bsd === 'object' && bsd !== null && 'domain' in bsd && typeof bsd.domain === 'string') {
      return [bsd.domain];
    }
    return [];
  });
}

async function listRecentBitlinks({
  auth,
  groupGuid,
}: {
  auth: BitlyAuthProps;
  groupGuid: string;
}): Promise<BitlyLink[]> {
  const guid = requireGuid({ value: groupGuid, label: 'Group' });
  const pages: BitlyLink[][] = [];
  let cursor: string | undefined;
  for (let page = 0; page < DROPDOWN_MAX_PAGES; page++) {
    const response = await bitlyApiCall<{ links?: BitlyLink[]; pagination?: BitlyPagination }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: `/groups/${guid}/bitlinks`,
      query: { size: 100, archived: 'both', search_after: cursor },
      operation: 'list Bitlinks',
    });
    pages.push(response.links ?? []);
    cursor = response.pagination?.search_after || undefined;
    if (!cursor) {
      break;
    }
  }
  return pages.flat();
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const DROPDOWN_MAX_PAGES = 10;

export const tristateOptions = {
  disabled: false,
  options: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
};
