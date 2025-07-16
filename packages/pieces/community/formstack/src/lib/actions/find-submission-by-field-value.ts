import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSubmissionByFieldValue = createAction({
  auth: formStackAuth,
  name: 'findSubmissionByFieldValue',
  displayName: 'Find Submission by Field Value',
  description: 'Search submissions by field values',
  props: {
    search_value: Property.LongText({
      displayName: 'Search Value',
      description: 'Value to search for (minimum 3 characters)',
      required: true,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (1-100)',
      required: false,
      defaultValue: 25,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number to return',
      required: false,
      defaultValue: 1,
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort results by submission ID',
      required: false,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Newest First (DESC)', value: 'DESC' },
          { label: 'Oldest First (ASC)', value: 'ASC' },
        ],
      },
    }),
    include_form_names: Property.Checkbox({
      displayName: 'Include Form Names',
      description: 'Include form names in results',
      defaultValue: true,
      required: false,
    }),
  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    
    const {
      search_value,
      per_page = 25,
      page = 1,
      sort_order = 'DESC',
      include_form_names = true,
    } = context.propsValue;

    if (!search_value || search_value.trim().length < 3) {
      return {
        success: false,
        error: 'invalid_search_length',
        message: 'Search value must be at least 3 characters long.',
        search_value,
      };
    }

    const validatedPerPage = Math.min(Math.max(1, per_page || 25), 100);
    const validatedPage = Math.max(1, page || 1);

    try {
      const params = new URLSearchParams();
      params.append('search', search_value.trim());
      params.append('per_page', validatedPerPage.toString());
      params.append('page', validatedPage.toString());
      
      if (sort_order) {
        params.append('sort', `id-${sort_order}`);
      }

      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        `/submission?${params.toString()}`,
        {}
      );

      const submissions = response.submissions || [];
      const total = response.total || 0;
      const pages = response.pages || 0;

      let formNames: Record<string, string> = {};
      if (include_form_names && submissions.length > 0) {
        try {
          const formIds = [...new Set(submissions.map((sub: any) => sub.formId))];
          
          const formRequests = formIds.map(async (formId: any) => {
            try {
              const formDetails = await makeRequest(
                accessToken,
                HttpMethod.GET,
                `/form/${formId}.json`,
                {}
              );
              return { id: formId, name: formDetails.name };
            } catch {
              return { id: formId, name: `Form ${formId}` };
            }
          });

          const formResults = await Promise.all(formRequests);
          formNames = formResults.reduce((acc, form) => {
            acc[form.id] = form.name;
            return acc;
          }, {} as Record<string, string>);
        } catch (error) {
          console.warn('Could not fetch form names:', error);
        }
      }

      const formattedSubmissions = submissions.map((submission: any) => {
        const result: any = {
          id: submission.id,
          form_id: submission.formId,
          submitted_at: submission.timestamp,
          submitter_info: {
            ip_address: submission.remote_addr,
            user_agent: submission.user_agent,
            location: submission.latitude && submission.longitude ? {
              latitude: submission.latitude,
              longitude: submission.longitude,
            } : null,
          },
        };

        if (include_form_names && formNames[submission.formId]) {
          result.form_name = formNames[submission.formId];
        }

        return result;
      });

      return {
        success: true,
        search_query: search_value.trim(),
        results: {
          submissions: formattedSubmissions,
          pagination: {
            current_page: validatedPage,
            per_page: validatedPerPage,
            total_results: total,
            total_pages: pages,
            has_next_page: validatedPage < pages,
            has_previous_page: validatedPage > 1,
          },
          search_options: {
            sort_order,
            include_form_names,
          },
        },
        message: `Found ${total} submission${total === 1 ? '' : 's'} matching "${search_value.trim()}"`,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('400')) {
        return {
          success: false,
          error: 'invalid_search',
          message: 'Invalid search parameters. Please check your search value and try again.',
          search_value,
        };
      }

      if (errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'access_denied',
          message: 'Access denied. You may not have permission to search submissions.',
          search_value,
        };
      }

      return {
        success: false,
        error: 'search_failed',
        message: `Search failed: ${errorMessage}`,
        search_value,
      };
    }
  },
});
