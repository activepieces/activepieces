import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';



export const updatedRecord = createTrigger({
  auth: insightlyAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Fires when an existing record is updated in Insightly',
  type: TriggerStrategy.POLLING,
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
      defaultValue: 'na1'
    }),
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor for updates',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'Contacts' },
          { label: 'Lead', value: 'Leads' },
          { label: 'Opportunity', value: 'Opportunities' },
          { label: 'Organization', value: 'Organisations' },
          { label: 'Project', value: 'Projects' },
          { label: 'Task', value: 'Tasks' },
          { label: 'Event', value: 'Events' },
          { label: 'Note', value: 'Notes' },
          { label: 'Product', value: 'Products' },
          { label: 'Quote', value: 'Quotation' }
        ]
      }
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'Maximum number of records to fetch per polling cycle (1-500)',
      required: false,
      defaultValue: 100
    })
  },
  onEnable: async (context) => {
    // Initialize the last poll time for this trigger
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  onDisable: async (context) => {
    // Clean up stored state
    await context.store.delete('lastPollTime');
  },
  run: async (context) => {
    const { pod, objectType, maxRecords = 100 } = context.propsValue;
    const apiKey = context.auth;
    const lastPollTime = await context.store.get<string>('lastPollTime');
    
    const lastPollDate = lastPollTime 
      ? new Date(lastPollTime) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

    // Use the correct endpoint for each object type
    let endpoint = objectType;
    if (objectType === 'Products') {
      endpoint = 'Product';
    } else if (objectType === 'Quotation') {
      endpoint = 'Quotation';
    }

    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const limitedRecords = Math.min(Math.max(maxRecords, 1), 500);
    
    // Add updated_after parameter to get recently updated records
    const lastPollIso = lastPollDate.toISOString();
    const url = `${baseUrl}/${endpoint}?brief=false&count_total=false&top=${limitedRecords}&updated_after=${encodeURIComponent(lastPollIso)}`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: ''
        }
      });

      const records = Array.isArray(response.body) ? response.body : [];

      // Filter for truly updated records (updated after last poll, but not newly created)
      const updatedRecords = records
        .filter((record: any) => {
          const createdDateStr = record.DATE_CREATED_UTC || record.CREATED_DATE_UTC || record.DATE_CREATED;
          const updatedDateStr = record.DATE_UPDATED_UTC || record.UPDATED_DATE_UTC || record.DATE_UPDATED;
          
          if (!updatedDateStr) return false;
          
          // Handle both "2025-10-02 08:21:11" and "2025-10-03T17:53:38.953Z" formats
          const updatedDate = new Date(updatedDateStr.includes('T') ? updatedDateStr : updatedDateStr + 'Z');
          const createdDate = createdDateStr ? new Date(createdDateStr.includes('T') ? createdDateStr : createdDateStr + 'Z') : new Date(0);
          
          // Only include records that were:
          // 1. Updated after the last poll time
          // 2. Not newly created (created date is different from updated date)
          return updatedDate > lastPollDate && Math.abs(updatedDate.getTime() - createdDate.getTime()) > 1000; // 1 second difference
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(
            a.DATE_UPDATED_UTC || a.UPDATED_DATE_UTC || a.DATE_UPDATED || 0
          );
          const dateB = new Date(
            b.DATE_UPDATED_UTC || b.UPDATED_DATE_UTC || b.DATE_UPDATED || 0
          );
          return dateB.getTime() - dateA.getTime();
        });

      // Update the last poll time
      await context.store.put('lastPollTime', new Date().toISOString());

      return updatedRecords;
    } catch (error: any) {
      throw new Error(`Failed to fetch updated records: ${error.message}`);
    }
  },
  test: async (context) => {
    const { pod, objectType } = context.propsValue;
    const apiKey = context.auth;

    // Use the correct endpoint for each object type
    let endpoint = objectType;
    if (objectType === 'Products') {
      endpoint = 'Product';
    } else if (objectType === 'Quotation') {
      endpoint = 'Quotation';
    }

    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${endpoint}?top=50&brief=false`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: ''
        }
      });

      const records = Array.isArray(response.body) ? response.body : [];
      
      // Sort by update date (most recently updated first) and return top 5
      return records
        .sort((a: any, b: any) => {
          const dateA = new Date(
            a.DATE_UPDATED_UTC || a.UPDATED_DATE_UTC || a.DATE_UPDATED || 0
          );
          const dateB = new Date(
            b.DATE_UPDATED_UTC || b.UPDATED_DATE_UTC || b.DATE_UPDATED || 0
          );
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
    } catch (error: any) {
      throw new Error(`Failed to test trigger: ${error.message}`);
    }
  },
  sampleData: {
    OPPORTUNITY_ID: 789012,
    OPPORTUNITY_NAME: 'Q4 Enterprise Deal',
    OPPORTUNITY_DETAILS: 'Large enterprise opportunity for software licensing',
    BID_AMOUNT: 50000,
    BID_CURRENCY: 'USD',
    PROBABILITY: 75,
    FORECAST_CLOSE_DATE: '2025-12-31T23:59:59.000Z',
    OWNER_USER_ID: 456,
    DATE_CREATED_UTC: '2025-10-01T09:53:54.704Z',
    DATE_UPDATED_UTC: '2025-10-03T15:30:22.815Z',
    ORGANISATION_ID: 123,
    CUSTOMFIELDS: [
      {
        FIELD_NAME: 'DEAL_SIZE',
        FIELD_VALUE: 'Large'
      }
    ],
    TAGS: [
      {
        TAG_NAME: 'High Priority'
      }
    ]
  },
});
