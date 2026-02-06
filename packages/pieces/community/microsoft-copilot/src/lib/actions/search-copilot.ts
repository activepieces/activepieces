import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365CopilotAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';

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
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results to return per page (1-100). Default: 25.',
      required: false,
      defaultValue: 25,
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
    const { query, pageSize, filterExpression, resourceMetadata } =
      context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const requestBody: any = {
      query: query,
    };

    if (pageSize && pageSize > 0 && pageSize <= 100) {
      requestBody.pageSize = pageSize;
    }

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

    const response: any = await client
      .api('beta/copilot/search')
      .post(requestBody);

    return response;
  },
});
