import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
import { fetchEntityTypes, makeEntityRequest, createEntityFilters } from '../common/entity-utils';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalListEntitiesAction = createAction({
  auth: drupalAuth,
  name: 'drupal-list-entities',
  displayName: 'List Entities',
  description: 'List entities of any type (content, users, taxonomy terms, etc.)',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'The entity type to list.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        return await fetchEntityTypes(auth as DrupalAuthType);
      },
    }),
    filters: Property.DynamicProperties({
      displayName: 'Filters',
      refreshers: ['entity_type'],
      required: false,
      props: async ({ entity_type }) => createEntityFilters(entity_type),
    }),
    sort_field: Property.Dropdown({
      displayName: 'Sort Field',
      description: 'Field to sort by (leave empty for default sorting)',
      required: false,
      refreshers: ['entity_type'],
      options: async ({ entity_type }) => {
        if (!(entity_type as any)?.fields) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select entity type first',
          };
        }

        // Show all sortable fields from the entity definition
        const entityFields = (entity_type as any).fields || [];
        
        const sortableFields = entityFields
          .filter((field: any) => ['string', 'integer', 'decimal', 'float', 'timestamp'].includes(field.type))
          .map((field: any) => ({ label: field.label, value: field.key }));

        return {
          disabled: false,
          options: sortableFields,
        };
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Sort direction',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Descending', value: 'DESC' },
          { label: 'Ascending', value: 'ASC' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { website_url } = auth as DrupalAuthType;
    
    // Build conditions from dynamic filters
    const conditions: Record<string, any> = {};
    if (propsValue.filters) {
      Object.entries(propsValue.filters).forEach(([key, value]) => {
        // Only include filters that have values
        if (value !== undefined && value !== null && value !== '') {
          conditions[key] = value;
        }
      });
    }

    const requestBody = {
      entity_type: propsValue.entity_type.id,
      conditions,
      sort_field: propsValue.sort_field || undefined,
      sort_direction: propsValue.sort_direction || 'DESC',
    };

    console.debug('Entity list request', requestBody);
    
    const result = await makeEntityRequest(
      auth as DrupalAuthType,
      `/modeler_api/entity/list`,
      HttpMethod.POST,
      requestBody
    );
    
    console.debug('Entity list call completed', result);

    if (result.status === 200) {
      return result.body;
    } else {
      throw new Error(`Failed to list entities: ${result.status} - ${JSON.stringify(result.body)}`);
    }
  },
});