import {
  HttpMethod,
} from '@activepieces/pieces-common';
import { 
  PiecePropValueSchema,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../../';
import { makeJsonApiRequest } from './jsonapi';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

// =============================================================================
// ENTITY TYPE DISCOVERY
// Functions for discovering what entity types are available in Drupal
// =============================================================================

/**
 * Discovers available entity types from Drupal's JSON:API endpoint
 * 
 * This function queries the main JSON:API endpoint to see what entity types
 * and bundles are available, then filters them to only show content entities
 * that users would typically want to work with (not config entities).
 * 
 * @param auth - Drupal authentication credentials
 * @param context - Whether entities will be used for 'reading' or 'editing'
 * @returns Dropdown options for entity type selection
 */
async function fetchEntityTypes(auth: DrupalAuthType, context: 'reading' | 'editing') {
  if (!auth || !auth.website_url) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please configure authentication first',
    };
  }

  try {
    const response = await makeJsonApiRequest(auth, `${auth.website_url}/jsonapi`, HttpMethod.GET);
    
    if (response.status === 200) {
      const entityTypes: Array<{label: string; value: any}> = [];
      const data = response.body as any;
      
      // Design choice: Hardcode entity types, discover bundles dynamically
      // - Entity types are hardcoded to avoid config entities like 'action', 'view', etc.
      // - Bundles are discovered from JSON:API to support custom content types
      // - For editing: only node/media have reliable form display configurations
      // - For reading: include content entities that users typically query
      const allowedEntityTypes = context === 'editing' 
        ? ['node', 'media']
        : ['node', 'taxonomy_term', 'user', 'media'];
      
      if (data.links) {
        for (const [key, value] of Object.entries(data.links)) {
          if (key !== 'self' && typeof value === 'object' && (value as any).href) {
            const parts = key.split('--');
            if (parts.length === 2) {
              const [entityType, bundle] = parts;
              
              if (allowedEntityTypes.includes(entityType)) {
                const bundleName = bundle.charAt(0).toUpperCase() + bundle.slice(1).replace(/_/g, ' ');
                const entityTypeName = entityType.charAt(0).toUpperCase() + entityType.slice(1).replace(/_/g, ' ');
                const label = `${bundleName} (${entityTypeName})`;
                
                entityTypes.push({
                  label,
                  value: {
                    id: key,
                    entity_type: entityType,
                    bundle,
                  }
                });
              }
            }
          }
        }
      }
      
      return {
        disabled: false,
        options: entityTypes.sort((a, b) => a.label.localeCompare(b.label)),
      };
    }
  } catch (e) {
    console.error('Failed to fetch entity types', e);
  }
  
  return {
    disabled: true,
    options: [],
    placeholder: 'Error loading entity types',
  };
}

export async function fetchEntityTypesForReading(auth: DrupalAuthType) {
  return await fetchEntityTypes(auth, 'reading');
}

export async function fetchEntityTypesForEditing(auth: DrupalAuthType) {
  return await fetchEntityTypes(auth, 'editing');
}

// =============================================================================
// FORM DISPLAY DISCOVERY
// Functions for discovering how Drupal displays forms for entity editing
// =============================================================================

/**
 * Fetches the form display configuration for an entity bundle
 * 
 * In Drupal, administrators configure which fields appear on edit forms,
 * their order, and how they're displayed. This function retrieves that
 * configuration so we can show the same fields in the same order.
 * 
 * Without this, we might show fields that admins have intentionally hidden
 * or fields that are read-only and shouldn't be edited.
 * 
 * @param auth - Drupal authentication credentials
 * @param entityType - The entity type (e.g., 'node', 'user')
 * @param bundle - The bundle (e.g., 'article', 'page')
 * @returns Form display configuration object
 */
export async function fetchEntityFormDisplay(auth: DrupalAuthType, entityType: string, bundle: string) {
  try {
    const formDisplayId = `${entityType}.${bundle}.default`;
    const response = await makeJsonApiRequest(
      auth,
      `${auth.website_url}/jsonapi/entity_form_display/entity_form_display?filter[drupal_internal__id]=${encodeURIComponent(formDisplayId)}`,
      HttpMethod.GET
    );

    if (response.status === 200 && response.body) {
      const data = (response.body as any).data;
      if (data && data.length > 0) {
        return data[0].attributes.content || {};
      }
    }
  } catch (e) {
    console.error('Failed to fetch form display', e);
  }
  
  return {};
}

/**
 * Fetches available text formats for rich text fields
 * 
 * Drupal allows different text formats (like 'basic_html', 'full_html') 
 * for rich text fields. This function gets the available formats so users
 * can choose how their content should be processed.
 */
export async function fetchTextFormats(auth: DrupalAuthType) {
  try {
    const response = await makeJsonApiRequest(
      auth,
      `${auth.website_url}/jsonapi/filter_format/filter_format`,
      HttpMethod.GET
    );

    if (response.status === 200 && response.body) {
      const formats = (response.body as any).data || [];
      return formats.reduce((acc: Record<string, string>, format: any) => {
        const formatId = format.attributes.drupal_internal__format;
        const formatName = format.attributes.name;
        if (formatId && formatName) {
          acc[formatId] = formatName;
        }
        return acc;
      }, {});
    }
  } catch (e) {
    console.error('Failed to fetch text formats', e);
  }
  
  return {};
}

// =============================================================================
// FIELD CONFIGURATION DISCOVERY
// Functions for discovering field metadata and configuration
// =============================================================================

/**
 * Fetches detailed field configuration including labels and requirements
 * 
 * This gets the actual field definitions including human-readable labels,
 * whether fields are required, field types, etc. This metadata is used
 * to create appropriate form inputs with proper validation.
 * 
 * @param auth - Drupal authentication credentials
 * @param entityType - The entity type (e.g., 'node', 'user')
 * @param bundle - The bundle (e.g., 'article', 'page')
 * @returns Object mapping field names to their configuration
 */
export async function fetchEntityFieldConfig(auth: DrupalAuthType, entityType: string, bundle: string) {
  try {
    const response = await makeJsonApiRequest(
      auth,
      `${auth.website_url}/jsonapi/field_config/field_config?filter[entity_type]=${entityType}&filter[bundle]=${bundle}`,
      HttpMethod.GET
    );

    if (response.status === 200 && response.body) {
      const fields = (response.body as any).data || [];
      const fieldConfig: Record<string, any> = {};
      
      fields.forEach((field: any) => {
        const fieldName = field.attributes.field_name;
        fieldConfig[fieldName] = {
          label: field.attributes.label,
          required: field.attributes.required,
          fieldType: field.attributes.field_type,
        };
      });
      
      return fieldConfig;
    }
  } catch (e) {
    console.error('Failed to fetch field config', e);
  }
  
  return {};
}

/**
 * Checks if a field type can be edited with simple form inputs
 * 
 * Some Drupal field types are too complex for simple text/checkbox inputs
 * (like entity references, file uploads). This function determines which
 * field types we can reasonably handle in a workflow interface.
 */
export function isEditableFieldType(fieldType: string): boolean {
  const editableTypes = [
    'string', 'string_long', 'text', 'text_long', 'text_with_summary',
    'integer', 'decimal', 'float', 'boolean', 'email', 'telephone', 'uri'
  ];
  return editableTypes.includes(fieldType);
}

/**
 * Gets human-readable labels for Drupal base fields
 * 
 * TODO: This should be fetched from the form display instead of hardcoded.
 * Base fields like 'title', 'status' have standard labels, but these could
 * be customized by site administrators. We should get the actual labels
 * from the form display configuration.
 * 
 * @param fieldName - The machine name of the field
 * @returns Human-readable label for the field
 */
export function getBaseFieldLabel(fieldName: string): string {
  const baseFieldLabels: Record<string, string> = {
    'title': 'Title',
    'status': 'Published',
    'created': 'Authored on',
    'changed': 'Changed',
    'promote': 'Promoted to front page',
    'sticky': 'Sticky at top of lists',
    'name': 'Name',
    'mail': 'Email address',
  };
  
  return baseFieldLabels[fieldName] || fieldName;
}

// =============================================================================
// FIELD PROCESSING & FORM GENERATION
// Functions that combine the above data to generate form properties
// =============================================================================

/**
 * Extracts editable fields from form display configuration
 * 
 * This combines form display configuration (what fields to show) with
 * field configuration (labels, types, requirements) to create a list
 * of fields that should be editable in the workflow interface.
 * 
 * @param auth - Drupal authentication credentials  
 * @param entityType - The entity type (e.g., 'node', 'user')
 * @param bundle - The bundle (e.g., 'article', 'page')
 * @param formDisplayContent - Form display configuration from fetchEntityFormDisplay
 * @returns Array of field objects with name, type, label, required, weight
 */
export async function getEditableFieldsWithLabels(
  auth: DrupalAuthType, 
  entityType: string, 
  bundle: string, 
  formDisplayContent: Record<string, any>
) {
  const fieldConfig = await fetchEntityFieldConfig(auth, entityType, bundle);
  const fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    weight: number;
  }> = [];

  for (const [fieldName, config] of Object.entries(formDisplayContent)) {
    if (config && typeof config === 'object' && config.type) {
      const configInfo = fieldConfig[fieldName];
      
      if (configInfo) {
        // Custom field with configuration
        if (isEditableFieldType(configInfo.fieldType)) {
          fields.push({
            name: fieldName,
            type: configInfo.fieldType,
            label: configInfo.label,
            required: configInfo.required,
            weight: config.weight || 0
          });
        }
      } else {
        // Base field - check if it's editable
        if (['title', 'name', 'status'].includes(fieldName)) {
          fields.push({
            name: fieldName,
            type: fieldName === 'status' ? 'boolean' : 'string',
            label: getBaseFieldLabel(fieldName),
            required: ['title', 'name'].includes(fieldName),
            weight: config.weight || 0
          });
        }
      }
    }
  }

  // Sort by weight (form display order), then by label
  return fields.sort((a, b) => {
    if (a.weight !== b.weight) return a.weight - b.weight;
    return a.label.localeCompare(b.label);
  });
}

/**
 * Builds Activepieces Property objects for dynamic form generation
 * 
 * This is the main function that combines all the field discovery and 
 * configuration to create the actual form properties that users will
 * see in the Activepieces interface.
 * 
 * @param auth - Drupal authentication credentials
 * @param entityType - Selected entity type from dropdown
 * @param isCreateAction - Whether this is for creating (true) or updating (false)
 * @returns Dynamic properties object for Activepieces form
 */
export async function buildFieldProperties(
  auth: DrupalAuthType,
  entityType: any,
  isCreateAction = false
): Promise<DynamicPropsValue> {
  const properties: DynamicPropsValue = {};

  if (!entityType) {
    return properties;
  }

  try {
    const formDisplay = await fetchEntityFormDisplay(auth, entityType.entity_type, entityType.bundle);
    const textFormats = await fetchTextFormats(auth);
    const availableFields = await getEditableFieldsWithLabels(
      auth,
      entityType.entity_type,
      entityType.bundle,
      formDisplay
    );

    if (availableFields.length === 0) {
      properties['no_fields'] = Property.MarkDown({
        value: 'No editable fields found for this entity type.'
      });
      return properties;
    }

    // Generate properties for all editable fields
    for (const field of availableFields) {
      const displayName = field.label;
      const description = undefined;
      const isRequired = field.required && isCreateAction;
      
      if (field.type === 'text_with_summary' || field.type === 'text_long') {
        properties[field.name] = Property.LongText({
          displayName,
          description,
          required: isRequired,
        });

        // Add text format selection if formats are available
        if (Object.keys(textFormats).length > 0) {
          properties[`${field.name}_format`] = Property.StaticDropdown({
            displayName: `${displayName} Format`,
            required: false,
            options: {
              options: Object.entries(textFormats).map(([key, name]) => ({
                label: String(name),
                value: key,
              })),
            },
          });
        }
      } else if (field.type === 'boolean') {
        properties[field.name] = Property.Checkbox({
          displayName,
          description,
          required: isRequired,
        });
      } else {
        // Default to text input for most field types
        properties[field.name] = Property.ShortText({
          displayName,
          description,
          required: isRequired,
        });
      }
    }

  } catch (e) {
    console.error('Failed to generate field properties', e);
    properties['error'] = Property.MarkDown({
      value: 'Failed to load fields. Please check your authentication and entity type selection.'
    });
  }

  return properties;
}