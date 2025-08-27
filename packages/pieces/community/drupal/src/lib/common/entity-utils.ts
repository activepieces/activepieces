import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { drupalAuth } from '../../';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export interface DrupalEntityType {
  id: string;
  label: string;
  description: string;
  fields: DrupalEntityTypeFields[];
}

export interface DrupalEntityTypeFields {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: string;
  default_value: string;
  options?: DrupalEntityTypeFieldTypeSelectOptions[];
}

export interface DrupalEntityTypeFieldTypeSelectOptions {
  key: string;
  name: string;
}

/**
 * Fetches available entity types from Drupal
 */
export async function fetchEntityTypes(auth: DrupalAuthType) {
  const { website_url, api_key } = auth;
  
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please authenticate first.',
    };
  }

  try {
    const response = await httpClient.sendRequest<DrupalEntityType[]>({
      method: HttpMethod.GET,
      url: website_url + `/modeler_api/entity_types`,
      headers: {
        'x-api-key': api_key,
      },
    });
    
    console.debug('Entity types response', response);
    if (response.status === 200) {
      return {
        disabled: false,
        options: response.body.map((entity_type) => {
          return {
            label: entity_type.label,
            description: entity_type.description,
            value: entity_type,
          };
        }),
      };
    }
  } catch (e: any) {
    console.debug('Entity types error', e);
  }
  
  return {
    disabled: true,
    options: [],
    placeholder: 'Error processing entity types',
  };
}

/**
 * Makes a generic entity API request
 */
export async function makeEntityRequest<T = any>(
  auth: DrupalAuthType,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const { website_url, api_key } = auth;
  
  const request = {
    method,
    url: website_url + endpoint,
    headers: {
      'x-api-key': api_key,
    },
    ...(body && { body }),
  };

  return await httpClient.sendRequest<T>(request);
}

/**
 * Creates dynamic filter properties for an entity type
 */
export function createEntityFilters(entity_type: any) {
  // Simple status filter only
  return {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { 
        options: [
          { label: 'All', value: '' },
          { label: 'Published', value: '1' }, 
          { label: 'Unpublished', value: '0' }
        ] 
      },
    }),
  };
}