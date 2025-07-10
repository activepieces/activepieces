import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { klaviyoApiCall } from './client';

interface KlaviyoProfile {
  id: string;
  attributes: {
    email: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
}

interface KlaviyoList {
  id: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
  };
}

export const profileId = Property.Dropdown({
  displayName: 'Profile',
  description: 'Select a profile by email',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Klaviyo account first.',
      };
    }

    const profiles: KlaviyoProfile[] = [];
    let pageCursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore && profiles.length < 100) {
      const response: {
        data: KlaviyoProfile[];
        links?: { next?: string };
      } = await klaviyoApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/profiles',
        headers: {
          revision: '2025-04-15',
          accept: 'application/vnd.api+json',
        },
        query: {
          'page[size]': 100,
          ...(pageCursor ? { 'page[cursor]': pageCursor } : {}),
        },
      });

      if (!response?.data?.length) break;

      profiles.push(...response.data);

      if (response.links?.next) {
        const match = response.links.next.match(/page%5Bcursor%5D=([^&]+)/);
        pageCursor = match?.[1];
        hasMore = !!pageCursor;
      } else {
        hasMore = false;
      }
    }

    return {
      disabled: false,
      options: profiles.slice(0, 100).map((profile) => ({
        label: `${profile.attributes.email ?? 'No Email'} (${profile.attributes.first_name ?? ''} ${profile.attributes.last_name ?? ''})`.trim(),
        value: profile.id,
      })),
    };
  },
});



export const listId = Property.Dropdown({
  displayName: 'List',
  description: 'Select a list from your Klaviyo account',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Klaviyo account first.',
      };
    }

    const lists: KlaviyoList[] = [];
    let pageCursor: string | undefined = undefined;
    let hasMore: boolean = true;

    while (hasMore) {
      const response: {
        data: KlaviyoList[];
        links?: { next?: string };
      } = await klaviyoApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/lists',
        headers: {
          revision: '2025-04-15',
          accept: 'application/vnd.api+json',
        },
        query: pageCursor ? { 'page[cursor]': pageCursor } : {},
      });

      if (!response?.data?.length) break;

      lists.push(...response.data);

      const nextLink: string | undefined = response.links?.next;
      if (nextLink) {
        const match: RegExpMatchArray | null = nextLink.match(/page%5Bcursor%5D=([^&]+)/);
        const nextCursor: string | undefined = match?.[1];
        pageCursor = nextCursor;
        hasMore = !!nextCursor;
      } else {
        hasMore = false;
      }
    }

    return {
      disabled: false,
      options: lists.map((list) => ({
        label: list.attributes.name,
        value: list.id,
      })),
    };
  },
});
