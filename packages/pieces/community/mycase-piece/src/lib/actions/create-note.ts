import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createNote = createAction({
  auth: mycaseAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a new note for a case, client, or company in MyCase',
  props: {
    entity_type: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Choose the type of entity to create the note for',
      required: true,
      options: {
        options: [
          { label: 'Case', value: 'case' },
          { label: 'Client', value: 'client' },
          { label: 'Company', value: 'company' },
        ],
      },
      defaultValue: 'case',
    }),
    entity: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Entity',
      description: 'Select the entity to create the note for',
      required: true,
      refreshers: ['entity_type'],
      options: async ({ auth, entity_type }) => {
        if (!auth || !entity_type) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select entity type first',
          };
        }

        const api = createMyCaseApi(auth);
        let endpoint = '';
        let mapFunction = null;

        switch (entity_type) {
          case 'case':
            endpoint = '/cases';
            mapFunction = (item: any) => ({
              label: `${item.name}${item.case_number ? ` (${item.case_number})` : ''}`,
              value: item.id.toString(),
            });
            break;
          case 'client':
            endpoint = '/clients';
            mapFunction = (item: any) => ({
              label: `${item.first_name} ${item.last_name}${item.email ? ` (${item.email})` : ''}`,
              value: item.id.toString(),
            });
            break;
          case 'company':
            endpoint = '/companies';
            mapFunction = (item: any) => ({
              label: item.name,
              value: item.id.toString(),
            });
            break;
          default:
            return {
              disabled: true,
              options: [],
              placeholder: 'Invalid entity type',
            };
        }

        const response = await api.get(endpoint, { page_size: '100' });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map(mapFunction),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: `Failed to load ${entity_type}s`,
        };
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the note',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'The body text of the note',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date and time of the note',
      required: true,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);

    // Build the request body
    const requestBody = {
      subject: context.propsValue.subject,
      note: context.propsValue.note,
      date: new Date(context.propsValue.date).toISOString(),
    };

    try {
      let endpoint: string;
      let entityName: string;

      switch (context.propsValue.entity_type) {
        case 'case':
          endpoint = `/cases/${context.propsValue.entity}/notes`;
          entityName = 'case';
          break;
        case 'client':
          endpoint = `/clients/${context.propsValue.entity}/notes`;
          entityName = 'client';
          break;
        case 'company':
          endpoint = `/companies/${context.propsValue.entity}/notes`;
          entityName = 'company';
          break;
        default:
          return {
            success: false,
            error: 'Invalid entity type',
          };
      }

      const response = await api.post(endpoint, requestBody);

      if (response.success) {
        return {
          success: true,
          note: response.data,
          message: `Note "${context.propsValue.subject}" created successfully for ${entityName} ${context.propsValue.entity}`,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create note',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});