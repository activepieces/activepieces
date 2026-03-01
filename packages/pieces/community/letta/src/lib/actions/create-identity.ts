import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { getLettaClient } from '../common/client';
import type {
  IdentityCreateParams,
  Identity,
  IdentityProperty,
} from '../common/types';

export const createIdentity = createAction({
  auth: lettaAuth,
  name: 'createIdentity',
  displayName: 'Create Identity',
  description: 'Creates a Letta identity',
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

    const client = getLettaClient(context.auth.props);

    const body: IdentityCreateParams = {
      identifier_key: identifierKey,
      name: name,
      identity_type: identityType as 'org' | 'user' | 'other',
    };

    if (projectId) {
      body.project_id = projectId;
    }

    if (properties && properties.length > 0) {
      body.properties = properties.map((prop: any) => {
        let parsedValue: string | number | boolean | { [key: string]: unknown };
        
        switch (prop.type) {
          case 'number':
            parsedValue = Number(prop.value);
            break;
          case 'boolean':
            parsedValue = prop.value === 'true' || prop.value === true;
            break;
          case 'json':
            try {
              parsedValue = JSON.parse(prop.value);
            } catch (e) {
              throw new Error(`Invalid JSON in property "${prop.key}": ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
            break;
          default:
            parsedValue = String(prop.value);
        }

        const identityProperty: IdentityProperty = {
          key: prop.key,
          type: prop.type as 'string' | 'number' | 'boolean' | 'json',
          value: parsedValue,
        };

        return identityProperty;
      });
    }

    const response: Identity = await client.identities.create(body);

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

