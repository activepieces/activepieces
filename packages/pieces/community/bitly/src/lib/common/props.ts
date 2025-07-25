import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bitlyApiCall } from './client';
import { BitlyAuthProps } from './client';

interface BitlyGroup {
  guid: string;
  name: string;
  bsds: Array<{ domain: string }>;
}

interface Bitlink {
    id: string;
    title: string;
}

const getBitlyGroups = async (auth: BitlyAuthProps): Promise<BitlyGroup[]> => {
    const response = await bitlyApiCall<{ groups: BitlyGroup[] }>({
        auth,
        method: HttpMethod.GET,
        resourceUri: '/groups',
    });
    return response.groups || [];
};

export const groupGuid = Property.Dropdown({
  displayName: 'Group',
  description: 'The group where the item will be managed.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    const { accessToken } = auth as BitlyAuthProps;
    if (!accessToken) {
      return { disabled: true, options: [], placeholder: 'Please connect your Bitly account first.' };
    }
    try {
      const groups = await getBitlyGroups({ accessToken });
      if (groups.length === 0) {
        return { disabled: true, options: [], placeholder: 'No groups found in your account.' };
      }
      return {
        disabled: false,
        options: groups.map((group) => ({
          label: group.name,
          value: group.guid,
        })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: `Error fetching groups: ${(e as Error).message}` };
    }
  },
});

export const domain = Property.Dropdown({
    displayName: 'Domain',
    description: 'Domain to use for the Bitlink.',
    required: false,
    refreshers: ['group_guid'],
    options: async ({ auth, group_guid }) => {
        const { accessToken } = auth as BitlyAuthProps;
        if (!accessToken || !group_guid) {
            return { disabled: true, options: [], placeholder: 'Please select a group first.' };
        }
        try {
            const groups = await getBitlyGroups({ accessToken });
            const selectedGroup = groups.find(g => g.guid === group_guid);
            const customDomains = selectedGroup?.bsds?.map(bsd => bsd.domain) || [];
            const allDomains = ['bit.ly', ...customDomains];
            return {
                disabled: false,
                options: allDomains.map(d => ({
                    label: d,
                    value: d,
                })),
            };
        } catch (e) {
            return { disabled: true, options: [], placeholder: `Error fetching domains: ${(e as Error).message}` };
        }
    },
});

export const bitlinkDropdown = Property.Dropdown({
    displayName: 'Bitlink',
    description: 'Select the Bitlink to modify.',
    required: true,
    refreshers: ['group_guid'],
    options: async ({ auth, group_guid }) => {
        const { accessToken } = auth as BitlyAuthProps;
        if (!accessToken) return { disabled: true, options: [], placeholder: 'Please connect your Bitly account first.' };
        if (!group_guid) return { disabled: true, options: [], placeholder: 'Please select a group first.' };
        
        try {
            const response = await bitlyApiCall<{ links: Bitlink[] }>({
                auth: { accessToken },
                method: HttpMethod.GET,
                resourceUri: `/groups/${group_guid as string}/bitlinks`,
            });
            return {
                disabled: false,
                options: response.links.map(link => ({
                    label: `${link.title || 'No Title'} (${link.id})`,
                    value: link.id
                }))
            };
        } catch (e) {
            return { disabled: true, options: [], placeholder: `Error fetching Bitlinks: ${(e as Error).message}` };
        }
    }
});
