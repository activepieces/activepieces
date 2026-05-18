import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { getLettaClient } from '../common/client';
import type {
  IdentityListParams,
  Identity,
} from '../common/types';

export const getIdentities = createAction({
  auth: lettaAuth,
  name: 'getIdentities',
  displayName: 'Get Identities',
  description: 'Searches for identities in your Letta Project',
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

    const client = getLettaClient(context.auth.props);

    const query: IdentityListParams = {};

    if (identifierKey) {
      query.identifier_key = identifierKey;
    }

    if (name) {
      query.name = name;
    }

    if (identityType) {
      query.identity_type = identityType as 'org' | 'user' | 'other';
    }

    if (projectId) {
      query.project_id = projectId;
    }

    if (limit !== undefined && limit !== null) {
      query.limit = limit;
    }

    const identitiesPage = await client.identities.list(query);

    const identities: Identity[] = [];
    for await (const identity of identitiesPage) {
      identities.push(identity);
    }

    return {
      identities,
      count: identities.length,
      success: true,
    };
  },
});

