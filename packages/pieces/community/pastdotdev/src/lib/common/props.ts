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
        const connection = {
          apiKey: auth.props.apiKey,
          apiHost: auth.props.apiHost,
        };
        const search = (searchValue ?? '').trim();
        const directory = await listIdentities({ connection });
        const found =
          directory.truncated && search.length > 0
            ? await findIdentities({ connection, search })
            : [];
        const identities = mergeIdentities({ found, listed: directory.identities });
        return {
          disabled: false,
          options: identityOptions({ identities, search }),
          placeholder: identityPlaceholder({
            count: identities.length,
            truncated: directory.truncated,
          }),
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
}): Promise<IdentityDirectory> {
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
}): Promise<IdentityDirectory> {
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
  if (!hasMore) {
    return { identities, truncated: false };
  }
  if (!endCursor || remainingPages <= 1) {
    return { identities, truncated: true };
  }
  const rest = await collectIdentityPages({
    connection,
    after: endCursor,
    remainingPages: remainingPages - 1,
  });
  return {
    identities: [...identities, ...rest.identities],
    truncated: rest.truncated,
  };
}

async function findIdentities({
  connection,
  search,
}: {
  connection: PastDevConnection;
  search: string;
}): Promise<Identity[]> {
  const [byIdentity, byTrait] = await Promise.all([
    pastDevClient.findRecord<Identity>({
      connection,
      method: HttpMethod.GET,
      path: `/api/v1/identities/${encodeURIComponent(search)}`,
    }),
    Promise.all(
      SEARCHED_TRAITS.map((traitKey) =>
        pastDevClient.sendRequest<IdentityList>({
          connection,
          method: HttpMethod.GET,
          path: '/api/v1/identities',
          queryParams: {
            limit: String(TRAIT_MATCH_LIMIT),
            traitKey,
            traitValue: search,
          },
        })
      )
    ),
  ]);
  return [
    ...(byIdentity ? [byIdentity.body] : []),
    ...byTrait.flatMap((response) => response.body.identities),
  ];
}

function mergeIdentities({
  found,
  listed,
}: {
  found: Identity[];
  listed: Identity[];
}): Identity[] {
  const foundByIdentity = new Map(found.map((identity) => [identity.identity, identity]));
  return [
    ...foundByIdentity.values(),
    ...listed.filter((identity) => !foundByIdentity.has(identity.identity)),
  ];
}

function identityPlaceholder({
  count,
  truncated,
}: {
  count: number;
  truncated: boolean;
}): string {
  if (truncated) {
    return `The list shows the ${LISTED_IDENTITIES_LIMIT} newest identities. To find an older one, type its exact identity, name or email.`;
  }
  if (count === 0) {
    return 'No identity yet. Type an identity, or map one from an earlier step.';
  }
  return 'Select an identity, or type a new one.';
}

function identityOptions({
  identities,
  search,
}: {
  identities: Identity[];
  search: string;
}) {
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
const LISTED_IDENTITIES_LIMIT = (IDENTITY_PAGE_SIZE * MAX_IDENTITY_PAGES).toLocaleString('en-US');
const TRAIT_MATCH_LIMIT = 20;
const SEARCHED_TRAITS = ['name', 'email'];

export const pastDevProps = {
  identityDropdown,
  audienceDropdown,
};

type Identity = {
  identity: string;
  traits: Record<string, string>;
};

type IdentityDirectory = {
  identities: Identity[];
  truncated: boolean;
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
