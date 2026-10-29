import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { lettaApi } from '../common/client';
import { lettaSchemas } from '../common/schemas';
import { lettaProps } from '../common/props';
import type {
  IdentityListParams,
  Identity,
} from '../common/types';

export const getIdentities = createAction({
  auth: lettaAuth,
  name: 'getIdentities',
  classification: 'SEARCH',
  displayName: 'Get Identities',
  description: 'Searches for identities in your Letta Project. Letta Cloud no longer supports Identities; this only works on self-hosted Letta servers that still serve them.',
  audience: 'human',
  outputSchema: lettaSchemas.humanGetIdentities,
  props: {
    identifierKey: Property.ShortText({
      displayName: 'Identifier Key',
      description: 'Filter by identifier key',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Filter by identity name',
      required: false,
    }),
    identityType: Property.StaticDropdown({
      displayName: 'Identity Type',
      description: 'Filter by identity type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Organization', value: 'org' },
          { label: 'User', value: 'user' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Filter by project ID',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of identities to return',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const {
      identifierKey,
      name,
      identityType,
      projectId,
      limit,
    } = context.propsValue;

    const client = await lettaApi.getLettaClient({ auth: context.auth.props });

    const query: IdentityListParams = {};

    if (identifierKey) {
      query.identifier_key = identifierKey;
    }

    if (name) {
      query.name = name;
    }

    if (identityType) {
      query.identity_type = lettaProps.toIdentityType(identityType);
    }

    if (projectId) {
      query.project_id = projectId;
    }

    query.limit = lettaApi.resolveLimit({ limit, max: 1000, fallback: 100 });

    const identitiesPage = await lettaApi.callLetta(() => client.identities.list(query));
    const identities: Identity[] = identitiesPage.getPaginatedItems();

    return {
      identities,
      count: identities.length,
      success: true,
    };
  },
});

