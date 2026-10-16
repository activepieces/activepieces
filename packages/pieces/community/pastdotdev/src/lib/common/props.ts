import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { pastDevAuth } from '../auth';
import { PastDevConnection, pastDevClient } from './client';

function identityDropdown<R extends boolean>({
  required,
  description,
}: {
  required: R;
  description: string;
}) {
  return Property.Dropdown<string, R, typeof pastDevAuth>({
    auth: pastDevAuth,
    displayName: 'Identity',
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your past dev account first.',
        };
      }
      try {
        const identities = await listIdentities({
          connection: {
            apiKey: auth.props.apiKey,
            apiHost: auth.props.apiHost,
          },
        });
        return {
          disabled: false,
          options: identityOptions({ identities, searchValue }),
          placeholder:
            identities.length === 0
              ? 'No identity yet. Type an identity, or map one from an earlier step.'
              : 'Select an identity, or type a new one.',
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Could not load identities: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  });
}

const audienceDropdown = Property.Dropdown<string, false, typeof pastDevAuth>({
  auth: pastDevAuth,
  displayName: 'Audience',
  description:
    'Who can recall this memory. Leave it empty to make the memory visible to the whole project.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your past dev account first.',
      };
    }
    try {
      const response = await pastDevClient.sendRequest<AudienceList>({
        connection: { apiKey: auth.props.apiKey, apiHost: auth.props.apiHost },
        method: HttpMethod.GET,
        path: '/api/v1/audiences',
      });
      return {
        disabled: false,
        options: response.body.audiences.map((audience) => ({
          label:
            audience.name === audience.slug
              ? audience.name
              : `${audience.name} (${audience.slug})`,
          value: audience.slug,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Could not load audiences: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

async function listIdentities({
  connection,
}: {
  connection: PastDevConnection;
}): Promise<Identity[]> {
  return collectIdentityPages({
    connection,
    after: undefined,
    remainingPages: MAX_IDENTITY_PAGES,
  });
}

async function collectIdentityPages({
  connection,
  after,
  remainingPages,
}: {
  connection: PastDevConnection;
  after: string | undefined;
  remainingPages: number;
}): Promise<Identity[]> {
  const response = await pastDevClient.sendRequest<IdentityList>({
    connection,
    method: HttpMethod.GET,
    path: '/api/v1/identities',
    queryParams: {
      limit: String(IDENTITY_PAGE_SIZE),
      ...(after ? { after } : {}),
    },
  });
  const { identities, hasMore, endCursor } = response.body;
  if (!hasMore || !endCursor || remainingPages <= 1) {
    return identities;
  }
  const rest = await collectIdentityPages({
    connection,
    after: endCursor,
    remainingPages: remainingPages - 1,
  });
  return [...identities, ...rest];
}

function identityOptions({
  identities,
  searchValue,
}: {
  identities: Identity[];
  searchValue: string | undefined;
}) {
  const search = (searchValue ?? '').trim();
  const matches = identities
    .filter((identity) => matchesSearch({ identity, search }))
    .map((identity) => ({
      label: identity.identity,
      value: identity.identity,
      description: describeIdentity({ identity }),
    }));
  const typedIsKnown = identities.some((identity) => identity.identity === search);
  if (search.length === 0 || typedIsKnown) {
    return matches;
  }
  return [
    {
      label: `Use "${search}"`,
      value: search,
      description: 'past dev creates this identity on its first ingest.',
    },
    ...matches,
  ];
}

function matchesSearch({
  identity,
  search,
}: {
  identity: Identity;
  search: string;
}): boolean {
  if (search.length === 0) {
    return true;
  }
  const needle = search.toLowerCase();
  return [identity.identity, ...Object.values(identity.traits)].some((value) =>
    value.toLowerCase().includes(needle)
  );
}

function describeIdentity({ identity }: { identity: Identity }): string | undefined {
  const name = identity.traits['name'];
  const email = identity.traits['email'];
  const parts = [name, email].filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  );
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

const IDENTITY_PAGE_SIZE = 1000;
const MAX_IDENTITY_PAGES = 3;

export const pastDevProps = {
  identityDropdown,
  audienceDropdown,
};

type Identity = {
  identity: string;
  traits: Record<string, string>;
};

type IdentityList = {
  identities: Identity[];
  hasMore: boolean;
  endCursor: string | null;
};

type Audience = {
  slug: string;
  name: string;
  kind: string;
};

type AudienceList = {
  audiences: Audience[];
};
