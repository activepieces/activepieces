import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findFormByNameOrId = createAction({
  auth: formStackAuth,
  name: 'findFormByNameOrId',
  displayName: 'Find Form by Name or ID',
  description: 'Find a form by name or ID',
  props: {
    search_query: Property.ShortText({
      displayName: 'Form Name or ID',
      description: 'Enter form name or ID to search',
      required: true,
    }),
    include_folders: Property.Checkbox({
      displayName: 'Group by Folders',
      description: 'Organize results by folders',
      defaultValue: false,
      required: false,
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Name Match',
      description: 'Only exact name matches',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];

    const { search_query, include_folders, exact_match } = context.propsValue;

    const isNumericId = /^\d+$/.test(search_query.trim());

    if (isNumericId) {
      try {
        const response = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/form/${search_query}.json`,
          {}
        );

        return {
          search_type: 'id',
          query: search_query,
          found: true,
          form: {
            id: response.id,
            name: response.name,
            url: response.url,
            created: response.created,
            updated: response.updated,
            submissions: response.submissions,
            submissions_unread: response.submissions_unread,
            last_submission_time: response.last_submission_time,
            timezone: response.timezone,
            folder: response.folder,
          },
          message: `Form found with ID: ${search_query}`,
        };
      } catch (error) {
        return {
          search_type: 'id',
          query: search_query,
          found: false,
          form: null,
          message: `No form found with ID: ${search_query}`,
          error: 'Form not found or access denied',
        };
      }
    } else {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('search', search_query);
        
        if (include_folders) {
          queryParams.append('folders', 'true');
        }

        const response = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/form.json?${queryParams.toString()}`,
          {}
        );

        let matchingForms = response.forms || [];

        if (exact_match) {
          matchingForms = matchingForms.filter((form: any) => 
            form.name.toLowerCase() === search_query.toLowerCase()
          );
        }

        const foundCount = matchingForms.length;

        return {
          search_type: 'name',
          query: search_query,
          found: foundCount > 0,
          total_found: foundCount,
          forms: matchingForms.map((form: any) => ({
            id: form.id,
            name: form.name,
            url: form.url,
            created: form.created,
            updated: form.updated,
            submissions: form.submissions,
            submissions_unread: form.submissions_unread,
            last_submission_time: form.last_submission_time,
            views: form.views,
          })),
          message: foundCount > 0 
            ? `Found ${foundCount} form${foundCount === 1 ? '' : 's'} matching "${search_query}"` 
            : `No forms found matching "${search_query}"`,
          search_options: {
            exact_match_used: exact_match,
            folders_included: include_folders,
          },
        };
      } catch (error) {
        return {
          search_type: 'name',
          query: search_query,
          found: false,
          forms: [],
          message: `Search failed for "${search_query}"`,
          error: 'Unable to search forms or access denied',
        };
      }
    }
  },
});
