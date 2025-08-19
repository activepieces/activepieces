import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalCreateContentAction = createAction({
  auth: drupalAuth,
  name: 'drupal-create-content',
  displayName: 'Create Content',
  description: 'Create a new content entity on the Drupal site',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity type',
      description: 'The entity type and bundle to create.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const { website_url, api_key } = (auth as DrupalAuthType);
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
      },
    }),
    fields: Property.DynamicProperties({
      displayName: 'Content',
      refreshers: ['entity_type'],
      required: true,
      props: async ({ entity_type }) => {
        console.debug('Entity type field input', entity_type);
        const fields: Record<string, any> = {};
        const items = entity_type['fields'] as DrupalEntityTypeFields[];
        items.forEach((field: any) => {
          if (field.type === 'boolean') {
            fields[field.key] = Property.Checkbox({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          } else if (field.type === 'created') {
            fields[field.key] = Property.DateTime({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          } else if (field.type === 'text_with_summary') {
            fields[field.key] = Property.LongText({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          } else if (field.type === 'comment') {
            // Ignore this field.
          } else {
            fields[field.key] = Property.ShortText({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          }
        });
        console.debug('Fields for this entity type', fields);
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { website_url, api_key } = (auth as DrupalAuthType);
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: website_url + `/modeler_api/entity/create`,
      body: {
        entity_type: propsValue.entity_type.id,
        fields: propsValue.fields,
      },
      headers: {
        'x-api-key': api_key,
      },
    };

    console.debug('Entity create', propsValue);
    const result = await httpClient.sendRequest<DrupalEntityType>(request);
    console.debug('Entity create call completed', result);

    if (result.status === 200 || result.status === 202) {
      return result.body;
    } else {
      return result;
    }
  },
});

interface DrupalEntityType {
  id: string;
  label: string;
  description: string;
  fields: DrupalEntityTypeFields[];
}

interface DrupalEntityTypeFields {
  key: string;
  label: string;
  description: string;
  required: boolean;
  type: string,
  defaultValue: string,
}
