import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findForm = createAction({
  auth: PaperformAuth,
  name: 'findForm',
  displayName: 'Find Form',
  description: 'Retrieve form metadata or configuration by ID or name',
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the form',
      required: true,
      options: {
        options: [
          { label: 'Form ID', value: 'id' },
          { label: 'Form Title', value: 'title' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The ID or title of the form to find',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of results to return (max 100)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { search_by, search_value, limit } = context.propsValue;
    const apiKey = context.auth as string;

    let response;
    let foundForm;

    if (search_by === 'id') {
      // If searching by ID, try to get the specific form directly
      try {
        response = await makeRequest(
          apiKey,
          HttpMethod.GET,
          `/forms/${search_value}`
        );
        foundForm = response;
      } catch (error: any) {
        if (error.message.includes('404')) {
          return {
            success: false,
            error: 'form_not_found',
            message: `Form with ID "${search_value}" was not found`,
            search_by,
            search_value,
          };
        }
        throw error;
      }
    } else {
      // If searching by title, use the search endpoint
      const queryParams = new URLSearchParams();
      queryParams.append('search', search_value);
      queryParams.append('limit', (limit || 20).toString());

      response = await makeRequest(
        apiKey,
        HttpMethod.GET,
        `/forms?${queryParams.toString()}`
      );

      const forms = response.data || response;

      if (!Array.isArray(forms)) {
        return {
          success: false,
          error: 'invalid_response',
          message: 'Invalid response format from API',
        };
      }

      // Find exact or partial match
      foundForm =
        forms.find(
          (form: any) =>
            form.title &&
            form.title.toLowerCase().includes(search_value.toLowerCase())
        ) || forms[0]; // Take first result if no exact match

      if (!foundForm || forms.length === 0) {
        return {
          success: false,
          error: 'form_not_found',
          message: `Form with title containing "${search_value}" was not found`,
          search_by,
          search_value,
        };
      }
    }

    return {
      success: true,
      message: `Successfully found form with ${search_by} "${search_value}"`,
      form: foundForm,
      search_by,
      search_value,
    };
  },
});
