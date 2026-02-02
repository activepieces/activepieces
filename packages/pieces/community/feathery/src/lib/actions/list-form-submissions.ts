import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

export const listFormSubmissionsAction = createAction({
  auth: featheryAuth,
  name: 'list_form_submissions',
  displayName: 'List Form Submissions',
  description: 'List submission data for a particular form.',
  props: {
    form_id: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to get submissions for.',
      required: true,
      refreshers: [],
      auth: featheryAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const forms = await featheryCommon.apiCall<
          Array<{ id: string; name: string; active: boolean }>
        >({
          method: HttpMethod.GET,
          url: '/form/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: forms.map((form) => ({
            label: form.name,
            value: form.id,
          })),
        };
      },
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      description: 'Limit submissions to after this update time.',
      required: false,
    }),
    end_time: Property.DateTime({
      displayName: 'End Time',
      description: 'Limit submissions to before this update time.',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Limit submissions to after this creation time.',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Limit submissions to before this creation time.',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Limit the number of returned submissions.',
      required: false,
    }),
    completed: Property.StaticDropdown({
      displayName: 'Completion Status',
      description: 'Filter by completion status.',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Completed Only', value: 'true' },
          { label: 'Incomplete Only', value: 'false' },
        ],
      },
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description: 'Comma-separated list of field IDs to return.',
      required: false,
    }),
    no_field_values: Property.Checkbox({
      displayName: 'Exclude Field Values',
      description: 'Don\'t return field data. More performant for large datasets.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'How to sort the returned field values.',
      required: false,
      options: {
        options: [
          { label: 'Alphabetically by Field ID', value: '' },
          { label: 'By Form Layout', value: 'layout' },
        ],
      },
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (default 500, max 1000).',
      required: false,
    }),
    use_cache: Property.Checkbox({
      displayName: 'Use Cache',
      description: 'Use cached data for faster response (may be a few minutes old).',
      required: false,
    }),
    field_search: Property.Array({
      displayName: 'Field Search',
      description: 'Search for submissions with specific field values.',
      required: false,
      properties: {
        field_id: Property.ShortText({
          displayName: 'Field ID',
          description: 'The field ID to search.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'The value to match.',
          required: true,
        }),
      },
    }),
    fuzzy_search_threshold: Property.Number({
      displayName: 'Fuzzy Search Threshold',
      description: 'Score threshold between 0 and 1 for fuzzy search.',
      required: false,
    }),
    fuzzy_search_parameters: Property.Array({
      displayName: 'Fuzzy Search Parameters',
      description: 'Fields and terms for fuzzy search. Weights must sum to 1.',
      required: false,
      properties: {
        field_id: Property.ShortText({
          displayName: 'Field ID',
          description: 'The field to compare.',
          required: true,
        }),
        term: Property.ShortText({
          displayName: 'Search Term',
          description: 'The term to search for.',
          required: true,
        }),
        weight: Property.Number({
          displayName: 'Weight',
          description: 'Importance of this field (0-1). All weights must sum to 1.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const {
      form_id,
      start_time,
      end_time,
      created_after,
      created_before,
      count,
      completed,
      fields,
      no_field_values,
      sort,
      page_size,
      use_cache,
      field_search,
      fuzzy_search_threshold,
      fuzzy_search_parameters,
    } = context.propsValue;

    const queryParams = new URLSearchParams();
    queryParams.append('form_id', form_id as string);

    if (start_time) {
      queryParams.append('start_time', start_time);
    }
    if (end_time) {
      queryParams.append('end_time', end_time);
    }
    if (created_after) {
      queryParams.append('created_after', created_after);
    }
    if (created_before) {
      queryParams.append('created_before', created_before);
    }
    if (count !== undefined) {
      queryParams.append('count', count.toString());
    }
    if (completed && completed !== '') {
      queryParams.append('completed', completed);
    }
    if (fields) {
      queryParams.append('fields', fields);
    }
    if (no_field_values) {
      queryParams.append('no_field_values', 'true');
    }
    if (sort && sort !== '') {
      queryParams.append('sort', sort);
    }
    if (page_size !== undefined) {
      queryParams.append('page_size', page_size.toString());
    }
    if (use_cache) {
      queryParams.append('use_cache', 'true');
    }

    if (field_search && Array.isArray(field_search) && field_search.length > 0) {
      const fieldSearchArray = (field_search as Array<{ field_id: string; value: string }>).map(
        (fs) => ({ field_id: fs.field_id, value: fs.value })
      );
      queryParams.append('field_search', JSON.stringify(fieldSearchArray));
    }

    if (
      fuzzy_search_threshold !== undefined &&
      fuzzy_search_parameters &&
      Array.isArray(fuzzy_search_parameters) &&
      fuzzy_search_parameters.length > 0
    ) {
      const fuzzySearch = {
        threshold: fuzzy_search_threshold,
        parameters: (
          fuzzy_search_parameters as Array<{ field_id: string; term: string; weight: number }>
        ).map((p) => ({
          field_id: p.field_id,
          term: p.term,
          weight: p.weight,
        })),
      };
      queryParams.append('fuzzy_search', JSON.stringify(fuzzySearch));
    }

    const response = await featheryCommon.apiCall<{
      count: number;
      next: string | null;
      previous: string | null;
      total_pages: number;
      current_page: number;
      results: Array<{
        values: Array<{
          id: string;
          type: string;
          created_at: string;
          updated_at: string;
          value: unknown;
          hidden: boolean;
          display_text: string;
          internal_id: string;
        }>;
        user_id: string;
        submission_start: string;
        last_submitted: string;
      }>;
    }>({
      method: HttpMethod.GET,
      url: `/form/submission/?${queryParams.toString()}`,
      apiKey: context.auth.secret_text,
    });

    return response;
  },
});

