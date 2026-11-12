import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { lettaApi } from '../common/client';
import { lettaProps } from '../common/props';
import { lettaSchemas } from '../common/schemas';
import type {
  IdentityCreateParams,
  Identity,
} from '../common/types';

export const createIdentity = createAction({
  auth: lettaAuth,
  name: 'createIdentity',
  classification: 'WRITE',
  displayName: 'Create Identity',
  description: 'Creates a Letta identity. Letta Cloud no longer supports Identities; this only works on self-hosted Letta servers that still serve them.',
  audience: 'human',
  outputSchema: lettaSchemas.humanCreateIdentity,
  props: {
    identifierKey: Property.ShortText({
      displayName: 'Identifier Key',
      description: 'External, user-generated identifier key of the identity',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the identity',
      required: true,
    }),
    identityType: Property.StaticDropdown({
      displayName: 'Identity Type',
      description: 'The type of the identity',
      required: true,
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
      description: 'The project ID of the identity (optional)',
      required: false,
    }),
    properties: Property.Array({
      displayName: 'Properties',
      description: 'List of properties associated with the identity',
      required: false,
      properties: {
        key: Property.ShortText({
          displayName: 'Key',
          description: 'Property key',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'Property type',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
            ],
          },
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Property value (for JSON type, enter valid JSON string)',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const {
      identifierKey,
      name,
      identityType,
      projectId,
      properties,
    } = context.propsValue;

    const resolvedType = lettaProps.toIdentityType(identityType);
    if (resolvedType === undefined) {
      throw new Error('Identity Type must be org, user or other.');
    }

    const body: IdentityCreateParams = {
      identifier_key: identifierKey,
      name: name,
      identity_type: resolvedType,
    };

    if (projectId) {
      body.project_id = projectId;
    }

    if (properties && properties.length > 0) {
      body.properties = lettaApi.parseIdentityProperties(properties);
    }

    const client = await lettaApi.getLettaClient({ auth: context.auth.props });
    const response: Identity = await lettaApi.callLetta(() => client.identities.create(body));

    return {
      id: response.id,
      identifierKey: response.identifier_key,
      name: response.name,
      identityType: response.identity_type,
      projectId: response.project_id,
      properties: response.properties,
      success: true,
    };
  },
});

