import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerHookContext, OAuth2Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { quickbooksCommon } from '.';

export interface PollingOptions {
  entityName: string;
  queryFilter?: string;
  orderBy?: string;
  maxResults?: number;
  idKey?: string;
}

export const pollingHelper = {
  async poll<T>(
    context: TriggerHookContext<OAuth2Property<any>, any, any>,
    options: PollingOptions
  ): Promise<T[]> {
    const { entityName, queryFilter, orderBy, maxResults = 10, idKey = 'Id' } = options;
    const { auth, store } = context;

    // Get the last poll timestamp
    const lastPollTimestamp = await store.get<string>('lastPollTimestamp');
    const currentTimestamp = new Date().toISOString();

    // Build the query
    let query = `SELECT * FROM ${entityName}`;

    if (queryFilter || lastPollTimestamp) {
      query += ' WHERE ';

      if (lastPollTimestamp) {
        query += `MetaData.LastUpdatedTime > '${lastPollTimestamp}'`;
        if (queryFilter) query += ' AND ';
      }

      if (queryFilter) {
        query += queryFilter;
      }
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    query += ` MAXRESULTS ${maxResults}`;

    // Make the request
    const response = await quickbooksCommon.makeRequest<{ QueryResponse: { [key: string]: T[] } }>({
      auth: auth as unknown as OAuth2PropertyValue,
      method: HttpMethod.GET,
      path: 'query',
      query: { query },
    });

    // Store the current timestamp for the next poll
    await store.put('lastPollTimestamp', currentTimestamp);

    // Extract the entities from the response
    const entityKey = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    return response.QueryResponse[entityKey] || [];
  },

  async onEnable(context: TriggerHookContext<OAuth2Property<any>, any, any>): Promise<void> {
    // Store the current timestamp when the trigger is enabled
    await context.store.put('lastPollTimestamp', new Date().toISOString());
  },

  async onDisable(context: TriggerHookContext<OAuth2Property<any>, any, any>): Promise<void> {
    // Clean up any stored data
    await context.store.delete('lastPollTimestamp');
  },
};
