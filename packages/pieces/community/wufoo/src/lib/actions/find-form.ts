import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const findFormAction = createAction({
  auth: wufooAuth,
  name: 'find-form',
  displayName: 'Find Form by Name or Hash',
  description: 'Get details about a Wufoo form including settings, entry counts, and metadata.',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Choose the format for the API response. JSON is recommended for most integrations.',
      required: true,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    includeTodayCount: Property.Checkbox({
      displayName: 'Include Today Count',
      description: 'Include the number of entries submitted today in the response. Useful for daily analytics and monitoring.',
      required: false,
      defaultValue: false,
    }),

  },
  async run(context) {
    const { formIdentifier, format, includeTodayCount } = context.propsValue;

    try {
      const response = await wufooApiCall<WufooFormResponse | string>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/forms/${formIdentifier}.${format}`,
        query: {
          includeTodayCount: includeTodayCount ? 'true' : 'false',
          pretty: 'false',
        },
      });

      let parsedResponse = response;
      if (typeof response === 'string' && response.includes('OUTPUT =')) {
        const match = response.match(/OUTPUT = ({.*?});/);
        if (match) {
          try {
            parsedResponse = JSON.parse(match[1]);
          } catch (e) {
            parsedResponse = response;
          }
        }
      }

      if (format === 'json' && parsedResponse && typeof parsedResponse === 'object') {
        let formData: WufooFormResponse;
        if (Array.isArray(parsedResponse)) {
          formData = parsedResponse[0] as WufooFormResponse;
        } else if ((parsedResponse as any).Forms && Array.isArray((parsedResponse as any).Forms)) {
          formData = (parsedResponse as any).Forms[0] as WufooFormResponse;
        } else {
          formData = parsedResponse as WufooFormResponse;
        }
        
        return {
          success: true,
          message: 'Form details retrieved successfully',
          form: {
            name: formData.Name,
            description: formData.Description,
            hash: formData.Hash,
            url: formData.Url,
            isPublic: formData.IsPublic === '1',
            language: formData.Language,
            redirectMessage: formData.RedirectMessage,
            entryLimit: parseInt(formData.EntryLimit || '0'),
            todayCount: formData.EntryCountToday ? parseInt(formData.EntryCountToday) : undefined,
            dateCreated: formData.DateCreated,
            dateUpdated: formData.DateUpdated,
            startDate: formData.StartDate,
            endDate: formData.EndDate,
            fieldsLink: formData.LinkFields,
            entriesLink: formData.LinkEntries,
            entriesCountLink: formData.LinkEntriesCount,
          },
          rawResponse: parsedResponse,
        };
      } else {
        return {
          success: true,
          message: 'Form details retrieved successfully',
          response: parsedResponse,
        };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          `Form not found: The form with identifier "${formIdentifier}" does not exist or you do not have access to it. Please verify the form identifier and your permissions.`
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to view this form. Please check your Wufoo account permissions and API key scope.'
        );
      }
      
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Please verify your API key and subdomain are correct in the connection settings.'
        );
      }
      
      throw new Error(
        `Failed to retrieve form details: ${error.message || 'Unknown error occurred'}. Please check your form identifier and try again.`
      );
    }
  },
});


interface WufooFormResponse {
  Name: string;
  Description?: string;
  Hash: string;
  Url: string;
  IsPublic: string;
  Language: string;
  RedirectMessage?: string;
  EntryLimit?: string;
  EntryCountToday?: string;
  DateCreated: string;
  DateUpdated: string;
  StartDate: string;
  EndDate: string;
  LinkFields?: string;
  LinkEntries?: string;
  LinkEntriesCount?: string;
}
