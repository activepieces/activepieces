import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365CopilotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const searchCopilot = createAction({
  auth: microsoft365CopilotAuth,
  name: 'searchCopilot',
  displayName: 'Search Copilot',
  description:
    'Perform hybrid (semantic and lexical) search across OneDrive for work or school content using natural language queries',
  props: {
    query: Property.LongText({
      displayName: 'Search Query',
      description:
        'Natural language query to search for relevant files. Maximum 1,500 characters.',
      required: true,
    }),
    filterExpression: Property.LongText({
      displayName: 'Filter Expression (Optional)',
      description:
        'KQL filter expression for OneDrive data source (https://learn.microsoft.com/en-us/sharepoint/dev/general-development/keyword-query-language-kql-syntax-reference). Example: path:"https://contoso-my.sharepoint.com/personal/user/Documents/"',
      required: false,
    }),
    resourceMetadata: Property.Json({
      displayName: 'Resource Metadata Names (Optional)',
      description:
        'Array of metadata field names to include in results. Example: ["title", "author"]',
      required: false,
    }),
  },
  async run(context) {
    const { query, filterExpression, resourceMetadata } = context.propsValue;

    const requestBody: any = {
      query: query,
    };

    if (filterExpression || resourceMetadata) {
      requestBody.dataSources = {
        oneDrive: {},
      };

      if (filterExpression) {
        requestBody.dataSources.oneDrive.filterExpression = filterExpression;
      }

      if (resourceMetadata) {
        const metadataArray = Array.isArray(resourceMetadata)
          ? resourceMetadata
          : typeof resourceMetadata === 'string'
          ? JSON.parse(resourceMetadata)
          : [];
        if (metadataArray.length > 0) {
          requestBody.dataSources.oneDrive.resourceMetadataNames =
            metadataArray;
        }
      }
    }

    const response: any = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://graph.microsoft.com/beta/copilot/search',
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return response.body;
  },
});
