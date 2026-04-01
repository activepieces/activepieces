import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365CopilotAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const retrieveGroundingData = createAction({
  auth: microsoft365CopilotAuth,
  name: 'retrieveGroundingData',
  displayName: 'Retrieve Grounding Data',
  description:
    'Retrieve relevant text extracts from SharePoint, OneDrive, or Copilot connectors content for grounding AI solutions',
  props: {
    queryString: Property.LongText({
      displayName: 'Query String',
      description:
        'Natural language query to retrieve relevant text extracts (max 1500 characters)',
      required: true,
    }),
    dataSource: Property.StaticDropdown({
      displayName: 'Data Source',
      description: 'Where to retrieve the grounding data from',
      required: true,
      options: {
        options: [
          {
            label: 'SharePoint',
            value: 'sharePoint',
          },
          {
            label: 'OneDrive',
            value: 'oneDriveBusiness',
          },
          {
            label: 'Copilot Connectors',
            value: 'externalItem',
          },
        ],
      },
    }),
    filterExpression: Property.LongText({
      displayName: 'Filter Expression (optional)',
      description:
        'KQL expression to scope the retrieval (e.g., Author:"John Doe", FileExtension:"docx")',
      required: false,
    }),
    resourceMetadata: Property.Json({
      displayName: 'Resource Metadata (optional)',
      description:
        'Array of metadata fields to return for each item (e.g., ["title", "author"])',
      required: false,
    }),
    maximumNumberOfResults: Property.Number({
      displayName: 'Maximum Number of Results',
      description: 'Number of results to return (1-25)',
      required: false,
      defaultValue: 25,
    }),
    connectionIds: Property.Json({
      displayName: 'Connection IDs (optional)',
      description:
        'Array of Copilot connector IDs to search (only for Copilot Connectors)',
      required: false,
    }),
  },
  async run(context) {
    const {
      queryString,
      dataSource,
      filterExpression,
      resourceMetadata,
      maximumNumberOfResults,
      connectionIds,
    } = context.propsValue;

    const body: any = {
      queryString,
      dataSource: dataSource as
        | 'sharePoint'
        | 'oneDriveBusiness'
        | 'externalItem',
    };

    if (filterExpression) {
      body.filterExpression = filterExpression;
    }
    if (
      resourceMetadata &&
      Array.isArray(resourceMetadata) &&
      resourceMetadata.length > 0
    ) {
      body.resourceMetadata = resourceMetadata;
    }

    if (maximumNumberOfResults) {
      body.maximumNumberOfResults = Math.min(
        Math.max(maximumNumberOfResults, 1),
        25
      );
    }

    if (
      dataSource === 'externalItem' &&
      connectionIds &&
      Array.isArray(connectionIds) &&
      connectionIds.length > 0
    ) {
      body.dataSourceConfiguration = {
        externalItem: {
          connections: connectionIds.map((connectionId: string) => ({
            connectionId,
          })),
        },
      } as any;
    }

    const response: any = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://graph.microsoft.com/beta/copilot/retrieval',
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return response.body;
  },
});
