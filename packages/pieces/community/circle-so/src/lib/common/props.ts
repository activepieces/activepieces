import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-commom';
import { makeCircleRequest } from './index';

export const memberDropdown = Property.Dropdown({
  displayName: 'Member',
  description: 'The community member to retrieve details for',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Circle.so account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const members = await makeCircleRequest(apiKey, HttpMethod.GET, '/community_members');

    const options: DropdownOption<string>[] = (members || []).map((member: any) => ({
      label: `${member.name} (${member.email})`,
      value: member.id.toString(),
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const spaceDropdown = Property.Dropdown({
  displayName: 'Space',
  description: 'The Circle space to add the member to',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Circle.so account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const spaces = await makeCircleRequest(apiKey, HttpMethod.GET, '/spaces');

    const options: DropdownOption<string>[] = (spaces || []).map((space: any) => ({
      label: space.name,
      value: space.id.toString(),
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const postDropdown = Property.Dropdown({
  displayName: 'Post',
  description: 'The post to comment on',
  required: true,
  refreshers: ['spaceId'],
  options: async ({ auth, spaceId }) => {
    if (!auth || !spaceId) {
      return {
        disabled: true,
        placeholder: spaceId ? 'Please connect your Circle.so account' : 'Please select a space first',
        options: [],
      };
    }

    const apiKey = auth as string;
    const posts = await makeCircleRequest(apiKey,  HttpMethod.GET, `/spaces/${spaceId}/posts`);

    const options: DropdownOption<string>[] = (posts || []).map((post: any) => ({
      label: post.name,
      value: post.id.toString(),
    }));

    return {
      disabled: false,
      options,
    };
  },
});
