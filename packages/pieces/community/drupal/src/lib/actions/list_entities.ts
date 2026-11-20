import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../auth';
import { drupal } from '../common/jsonapi';
import { fetchEntityTypesForReading } from '../common/drupal-entities';


export const drupalListEntitiesAction = createAction({
  auth: drupalAuth,
  name: 'drupal-list-entities',
  classification: 'SEARCH',
  displayName: 'List Entities',
  description: 'List entities of one type, with optional filters and sorting.',
  audience: 'both',
  aiMetadata: { description: 'Lists/retrieves entities of a chosen type and bundle from Drupal via JSON:API, with optional filtering by published status, sorting, and a result limit (limit 0 returns all entities, following pagination). Use to query or scan existing content rather than fetch one known item. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    { key: 'content', display: 'section', label: 'Entities to List', icon: 'inbox', props: ['entity_type', 'published_status'] },
    { key: 'sorting', display: 'section', label: 'Sorting', icon: 'sliders', props: ['sort_by', 'sort_direction'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'filter', props: ['limit', 'output_options'] },
  ],
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'The kind of entity, shown as bundle (entity type).',
      required: true,
      refreshers: [],
      auth: drupalAuth,
      options: async ({ auth }) => fetchEntityTypesForReading(auth),
    }),
    published_status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return entities with this status.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Published', value: 'published' },
          { label: 'Unpublished', value: 'unpublished' },
        ],
      },
    }),
    sort_by: Property.DynamicProperties({
      displayName: 'Sort By',
      required: false,
      refreshers: ['entity_type'],
      auth: drupalAuth,
      props: async (propsValue) => {
        const entityInfo = propsValue['entity_type'] as any;
        if (!entityInfo) return {} as any;

        let sortOptions: Array<{ label: string; value: string }> = [];

        if (entityInfo.entity_type === 'taxonomy_term') {
          sortOptions = [
            { label: 'Updated', value: 'changed' },
            { label: 'Name', value: 'name' },
          ];
        } else if (entityInfo.entity_type === 'user') {
          sortOptions = [
            { label: 'Created', value: 'created' },
            { label: 'Updated', value: 'changed' },
            { label: 'Name', value: 'name' },
          ];
        } else {
          sortOptions = [
            { label: 'Created', value: 'created' },
            { label: 'Updated', value: 'changed' },
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
      description: 'Descending puts the newest dates and Z to A names first.',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Descending', value: 'DESC' },
          { label: 'Ascending', value: 'ASC' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most entities to return. 0 returns all of them.',
      required: true,
      defaultValue: 50,
    }),
    output_options: Property.DynamicProperties({
      displayName: 'Output',
      required: false,
      refreshers: ['entity_type'],
      auth: drupalAuth,
      props: async (propsValue) => {
        const entityInfo = propsValue['entity_type'] as any;
        if (!entityInfo) return {};

        // Only show minimal output option for nodes (they can have many fields)
        if (entityInfo.entity_type === 'node') {
          return {
            minimal_output: Property.Checkbox({
              displayName: 'Basic Fields Only',
              description: 'Return only ID, title, status and dates.',
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
      auth,
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