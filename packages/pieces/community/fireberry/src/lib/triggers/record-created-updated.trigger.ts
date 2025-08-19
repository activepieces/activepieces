import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';

export const recordCreatedOrUpdatedTrigger = createTrigger({
  name: 'record_created_or_updated',
  displayName: 'Record Created or Updated',
  description: 'Fires when a record is created or updated in Fireberry.',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    triggerType: Property.StaticDropdown({
      displayName: 'Trigger Type',
      required: true,
      defaultValue: 'both',
      options: {
        disabled: false,
        options: [
          { label: 'Created or Updated', value: 'both' },
          { label: 'Created Only', value: 'created' },
          { label: 'Updated Only', value: 'updated' },
        ],
      },
    }),
    lookbackMinutes: Property.Number({
      displayName: 'Lookback Period (minutes)',
      required: false,
      defaultValue: 60,
      description: 'How far back to look for records on first run (default: 60 minutes)',
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    accountname: "Sample Account",
    emailaddress1: "sample@example.com",
    createdon: "2025-07-17T10:39:30.003",
    modifiedon: "2025-07-17T10:39:30.003",
    accountid: "12345678-1234-1234-1234-123456789abc",
  },
  async test({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType } = propsValue;
    
    if (!objectType) {
      return [];
    }
    
    try {
      const objectsMetadata = await client.getObjectsMetadata();
      const targetObject = objectsMetadata.data.find(obj => obj.systemName === objectType);
      
      if (!targetObject) {
        throw new Error(`Object type '${objectType}' not found`);
      }
      
      const objectNumber = parseInt(targetObject.objectType);
      
      const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const response = await client.request<{
        success: boolean;
        data: {
          ObjectName: string;
          SystemName: string;
          ObjectType: number;
          PrimaryKey: string;
          PrimaryField: string;
          PageNum: number;
          SortBy: string;
          SortBy_Desc: boolean;
          IsLastPage: boolean;
          Columns: Array<Record<string, any>>;
          Data: Array<Record<string, any>>;
        };
      }>({
        method: HttpMethod.POST,
        resourceUri: '/api/query',
        body: {
          objecttype: objectNumber,
          query: `modifiedon >= '${sevenDaysAgo}'`,
          sort_by: 'modifiedon',
          sort_type: 'desc',
          page_size: 3,
        },
      });
      
      if (!response.success) {
        throw new Error('Failed to fetch sample data from Fireberry');
      }
      
      const records = response.data.Data || [];
      
      if (records.length === 0) {
        const fallbackResponse = await client.request<{
          success: boolean;
          data: {
            Data: Array<Record<string, any>>;
          };
        }>({
          method: HttpMethod.POST,
          resourceUri: '/api/query',
          body: {
            objecttype: objectNumber,
            sort_by: 'modifiedon',
            sort_type: 'desc',
            page_size: 3,
          },
        });
        
        if (fallbackResponse.success && fallbackResponse.data.Data) {
          return fallbackResponse.data.Data;
        }
      }
      
      return records;
      
    } catch (error: any) {
      console.error('Failed to generate sample data:', error);
      return [{
        [objectType === 'Contact' ? 'firstname' : 'accountname']: 'Sample Record',
        createdon: new Date().toISOString(),
        modifiedon: new Date().toISOString(),
      }];
    }
  },
  async onEnable({ store }) {
    await store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable({ store }) {
    await store.delete('lastPollTime');
  },
  async run({ auth, propsValue, store }) {
    const client = new FireberryClient(auth as string);
    const { objectType, triggerType, lookbackMinutes } = propsValue;
    
    let lastPollTime = await store.get<string>('lastPollTime');
    
    if (!lastPollTime) {
      const lookback = lookbackMinutes || 60;
      const cutoffTime = new Date(Date.now() - (lookback * 60 * 1000));
      lastPollTime = cutoffTime.toISOString();
    }
    
    const objectsMetadata = await client.getObjectsMetadata();
    const targetObject = objectsMetadata.data.find(obj => obj.systemName === objectType);
    
    if (!targetObject) {
      throw new Error(`Object type '${objectType}' not found`);
    }
    
    const objectNumber = parseInt(targetObject.objectType);
    
    let query = '';
    const cutoffDate = new Date(lastPollTime).toISOString().split('T')[0];
    
    if (triggerType === 'created') {
      query = `createdon >= '${cutoffDate}'`;
    } else if (triggerType === 'updated') {
      query = `modifiedon >= '${cutoffDate}'`;
    } else {
      query = `modifiedon >= '${cutoffDate}'`;
    }
    
    try {
      const response = await client.request<{
        success: boolean;
        data: {
          ObjectName: string;
          SystemName: string;
          ObjectType: number;
          PrimaryKey: string;
          PrimaryField: string;
          PageNum: number;
          SortBy: string;
          SortBy_Desc: boolean;
          IsLastPage: boolean;
          Columns: Array<Record<string, any>>;
          Data: Array<Record<string, any>>;
        };
      }>({
        method: HttpMethod.POST,
        resourceUri: '/api/query',
        body: {
          objecttype: objectNumber,
          query: query,
          sort_by: 'modifiedon',
          sort_type: 'desc',
          page_size: 50,
        },
      });
      
      if (!response.success) {
        throw new Error('Failed to fetch records from Fireberry');
      }
      
      const records = response.data.Data || [];
      
      await store.put('lastPollTime', new Date().toISOString());
      
      return records.reverse();
      
    } catch (error: any) {
      if (error.message?.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw new Error('Authentication failed. Please check your Fireberry API key.');
      }
      
      console.error('Fireberry trigger error:', error);
      throw new Error(`Failed to fetch records: ${error.message || 'Unknown error'}`);
    }
  },
}); 