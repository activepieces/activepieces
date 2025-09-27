import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
import { drupal } from '../common/jsonapi';
import { fetchEntityTypesForReading } from '../common/drupal-entities';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalListEntitiesAction = createAction({
  auth: drupalAuth,
  name: 'drupal-list-entities',
  displayName: 'List Entities',
  description: 'List entities from Drupal using JSON:API',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'Choose what type of content to list.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => fetchEntityTypesForReading(auth as DrupalAuthType),
    }),
    published_status: Property.StaticDropdown({
      displayName: 'Published Status',
      description: 'Filter by publication status',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Published only', value: 'published' },
          { label: 'Unpublished only', value: 'unpublished' },
        ],
      },
    }),
    sort_by: Property.DynamicProperties({
      displayName: 'Sort Options',
      description: 'Choose how to sort the entities',
      required: false,
      refreshers: ['entity_type'],
      props: async (propsValue) => {
        const entityInfo = propsValue['entity_type'] as any;
        if (!entityInfo) return {} as any;
        
        let sortOptions: Array<{label: string; value: string}> = [];
        
        if (entityInfo.entity_type === 'taxonomy_term') {
          sortOptions = [
            { label: 'Updated date', value: 'changed' },
            { label: 'Name', value: 'name' },
          ];
        } else if (entityInfo.entity_type === 'user') {
          sortOptions = [
            { label: 'Creation date', value: 'created' },
            { label: 'Updated date', value: 'changed' },
            { label: 'Name', value: 'name' },
          ];
        } else {
          sortOptions = [
            { label: 'Creation date', value: 'created' },
            { label: 'Updated date', value: 'changed' },
            { label: 'Title', value: 'title' },
          ];
        }
        
        return {
          sort_field: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: sortOptions[0].value,
            options: { options: sortOptions }
          })
        } as any;
      }
    }),
    sort_direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Newest first', value: 'DESC' },
          { label: 'Oldest first', value: 'ASC' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of entities to retrieve (0 = all entities)',
      required: true,
      defaultValue: 50,
    }),
    output_options: Property.DynamicProperties({
      displayName: 'Output Options',
      required: false,
      refreshers: ['entity_type'],
      props: async (propsValue) => {
        const entityInfo = propsValue['entity_type'] as any;
        if (!entityInfo) return {};

        // Only show minimal output option for nodes (they can have many fields)
        if (entityInfo.entity_type === 'node') {
          return {
            minimal_output: Property.Checkbox({
              displayName: 'Minimal Output',
              description: 'Return only basic fields (UUID, title, status, dates) instead of all entity data',
              required: false,
              defaultValue: true,
            })
          } as any;
        }

        return {} as any;
      }
    }),
  },
  async run({ auth, propsValue }) {
    const entityInfo = propsValue.entity_type as any;
    
    const filters: Record<string, any> = {};
    
    if (propsValue.published_status === 'published') {
      filters['status'] = '1';
    } else if (propsValue.published_status === 'unpublished') {
      filters['status'] = '0';
    }
    
    let fields: string[] | undefined;
    const outputOptions = propsValue.output_options as any;
    
    if (entityInfo.entity_type === 'node' && outputOptions?.minimal_output) {
      fields = ['id', 'title', 'status', 'created', 'changed', 'drupal_internal__nid', 'path'];
    } else if (entityInfo.entity_type === 'taxonomy_term') {
      fields = ['id', 'name', 'changed', 'created', 'path', 'drupal_internal__tid', 'status'];
    } else if (entityInfo.entity_type === 'user') {
      fields = ['id', 'name', 'mail', 'created', 'changed', 'status'];
    }
    
    const sortField = (propsValue.sort_by as any)?.sort_field;

    let entities = await drupal.listEntities(
      auth as DrupalAuthType,
      entityInfo.entity_type,
      entityInfo.bundle,
      {
        filters,
        sort: sortField,
        sortDirection: propsValue.sort_direction,
        fields,
        limit: propsValue.limit,
      }
    );
    
    // Remove type field for cleaner output
    const removeType = (entity: any) => {
      const { type, ...entityWithoutType } = entity;
      return entityWithoutType;
    };
    
    entities = Array.isArray(entities) 
      ? entities.map(removeType)
      : removeType(entities);
    
    return {
      entities: Array.isArray(entities) ? entities : [entities],
      count: Array.isArray(entities) ? entities.length : 1,
    };
  },
});