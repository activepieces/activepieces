import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerHookContext, OAuth2Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { quickbooksCommon, QuickbooksEntityResponse } from '.';

export interface PollingOptions<T> {
  entityName: string;
  queryFilter?: string[];
  orderBy?: string;
  maxResults?: number;
  idKey?: string;
  processItems?: (items: T[]) => Promise<unknown[]>;
}

export const pollingHelper = {
  /**
   * Poll for new entities
   * @param context The trigger context
   * @param options Polling options
   * @returns An array of new entities
   */
  async poll<T>(
    context: TriggerHookContext<OAuth2Property<any>, any, any>,
    options: PollingOptions<T>
  ): Promise<unknown[]> {
    const { entityName, queryFilter = [], orderBy = 'MetaData.LastUpdatedTime DESC', maxResults = 10, idKey = 'Id', processItems } = options;
    const { auth, store } = context;

    // Get the last poll timestamp
    const lastPollTimestamp = await store.get<string>('lastPollTimestamp');
    const currentTimestamp = new Date().toISOString();

    // Build the query conditions
    const conditions = [...queryFilter];

    if (lastPollTimestamp) {
      conditions.push(`MetaData.LastUpdatedTime > '${lastPollTimestamp}'`);
    }

    // Build the query
    const query = quickbooksCommon.buildQuery(
      entityName,
      conditions,
      orderBy,
      maxResults
    );

    try {
      // Make the request
      const response = await quickbooksCommon.makeRequest<QuickbooksEntityResponse<T>>({
        auth: auth as unknown as OAuth2PropertyValue,
        method: HttpMethod.GET,
        path: 'query',
        query: { query },
      });

      // Store the current timestamp for the next poll
      await store.put('lastPollTimestamp', currentTimestamp);

      // Extract the entities from the response
      const entityKey = entityName.charAt(0).toUpperCase() + entityName.slice(1);
      const items = response.QueryResponse?.[entityKey] as T[] || [];

      // If there's a custom processor, use it
      if (processItems && items.length > 0) {
        return await processItems(items);
      }

      return items;
    } catch (error) {
      console.error(`Error polling for ${entityName}:`, error);
      return [];
    }
  },

  /**
   * Initialize the trigger when enabled
   * @param context The trigger context
   */
  async onEnable(context: TriggerHookContext<OAuth2Property<any>, any, any>): Promise<void> {
    // Store the current timestamp when the trigger is enabled
    await context.store.put('lastPollTimestamp', new Date().toISOString());
  },

  /**
   * Clean up when the trigger is disabled
   * @param context The trigger context
   */
  async onDisable(context: TriggerHookContext<OAuth2Property<any>, any, any>): Promise<void> {
    // Clean up any stored data
    await context.store.delete('lastPollTimestamp');
  },

  /**
   * Test the trigger by returning the most recent items
   * @param context The trigger context
   * @param options Polling options
   * @returns An array of recent entities
   */
  async test<T>(
    context: TriggerHookContext<OAuth2Property<any>, any, any>,
    options: PollingOptions<T>
  ): Promise<unknown[]> {
    const { entityName, queryFilter = [], orderBy = 'MetaData.LastUpdatedTime DESC', maxResults = 5, processItems } = options;
    const { auth } = context;

    // Build the query
    const query = quickbooksCommon.buildQuery(
      entityName,
      queryFilter,
      orderBy,
      maxResults
    );

    try {
      // Make the request
      const response = await quickbooksCommon.makeRequest<QuickbooksEntityResponse<T>>({
        auth: auth as unknown as OAuth2PropertyValue,
        method: HttpMethod.GET,
        path: 'query',
        query: { query },
      });

      // Extract the entities from the response
      const entityKey = entityName.charAt(0).toUpperCase() + entityName.slice(1);
      const items = response.QueryResponse?.[entityKey] as T[] || [];

      // If there's a custom processor, use it
      if (processItems && items.length > 0) {
        return await processItems(items);
      }

      return items;
    } catch (error) {
      console.error(`Error testing poll for ${entityName}:`, error);
      return [];
    }
  }
};
