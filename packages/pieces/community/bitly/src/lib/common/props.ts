import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const shapeDropdown = Property.StaticDropdown({
  displayName: 'Shape',
  description: 'Select the shape of the second corner of the QR code',
  required: true,
  options: {
    options: [
      { label: 'Standard', value: 'standard' },
      { label: 'Slightly Round', value: 'slightly_round' },
      { label: 'Rounded', value: 'rounded' },
      { label: 'Extra Round', value: 'extra_round' },
      { label: 'Leaf', value: 'leaf' },
      { label: 'Leaf Inner', value: 'leaf_inner' },
      { label: 'Leaf Outer', value: 'leaf_outer' },
      { label: 'Target', value: 'target' },
      { label: 'Concave', value: 'concave' },
    ],
  },
});

export const bitlinkDropdown = Property.Dropdown({
  displayName: 'Bitlink',
  description: 'Select the Bitlink to modify.',
  required: true,
  refreshers: ['group_guid'],
  options: async ({ auth, group_guid }) => {
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/groups/${group_guid as string}/bitlinks`
      );
      return {
        disabled: false,
        options: response.links.map((link: any) => ({
          label: `${link.title || 'No Title'} (${link.id})`,
          value: link.id,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching Bitlinks: ${(e as Error).message}`,
      };
    }
  },
});

export const groupGuidDropdown = Property.Dropdown({
  displayName: 'Group',
  description: 'The group to which the Bitlink belongs.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    try {
      const groups = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/groups'
      );
      if (groups.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No groups found in your account.',
        };
      }
      return {
        disabled: false,
        options: groups.map((group: any) => ({
          label: group.name,
          value: group.guid,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching groups: ${(e as Error).message}`,
      };
    }
  },
});

export const domain = Property.Dropdown({
  displayName: 'Domain',
  description:
    'The domain to use for the Bitlink. Select a group to see available custom domains.',
  required: false,
  refreshers: ['group_guid'],
  options: async ({ auth, group_guid }) => {
    try {
      const groups = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/groups'
      );
      const selectedGroup = groups.find((g: any) => g.guid === group_guid);
      const customDomains =
        selectedGroup?.bsds?.map((bsd: any) => bsd.domain) || [];
      const allDomains = ['bit.ly', ...customDomains];
      return {
        disabled: false,
        options: allDomains.map((d) => ({
          label: d,
          value: d,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching domains: ${(e as Error).message}`,
      };
    }
  },
});
