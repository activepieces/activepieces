import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { BiginClient } from './client';

export const MODULE_API_NAMES = {
  CONTACTS: 'Contacts',
  COMPANIES: 'Accounts',
  PIPELINE_RECORDS: 'Pipelines',
  PRODUCTS: 'Products',
  TASKS: 'Tasks',
  EVENTS: 'Events',
  CALLS: 'Calls'
} as const;

export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  DATE: 'date',
  DATETIME: 'datetime',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  PICKLIST: 'picklist',
  LOOKUP: 'lookup'
} as const;

// Common field mappings for different modules
export const COMMON_FIELDS = {
  CONTACT: {
    FIRST_NAME: 'First_Name',
    LAST_NAME: 'Last_Name',
    EMAIL: 'Email',
    PHONE: 'Phone',
    MOBILE: 'Mobile',
    ACCOUNT_NAME: 'Account_Name',
    TITLE: 'Title',
    DESCRIPTION: 'Description'
  },
  COMPANY: {
    ACCOUNT_NAME: 'Account_Name',
    PHONE: 'Phone',
    WEBSITE: 'Website',
    DESCRIPTION: 'Description',
    BILLING_STREET: 'Billing_Street',
    BILLING_CITY: 'Billing_City',
    BILLING_STATE: 'Billing_State',
    BILLING_COUNTRY: 'Billing_Country',
    BILLING_CODE: 'Billing_Code'
  },
  PIPELINE_RECORD: {
    DEAL_NAME: 'Deal_Name',
    AMOUNT: 'Amount',
    STAGE: 'Stage',
    CLOSING_DATE: 'Closing_Date',
    CONTACT_NAME: 'Contact_Name',
    ACCOUNT_NAME: 'Account_Name',
    DESCRIPTION: 'Description'
  },
  TASK: {
    SUBJECT: 'Subject',
    DUE_DATE: 'Due_Date',
    STATUS: 'Status',
    PRIORITY: 'Priority',
    DESCRIPTION: 'Description',
    RELATED_TO: 'Related_To'
  },
  EVENT: {
    EVENT_TITLE: 'Event_Title',
    START_DATETIME: 'Start_DateTime',
    END_DATETIME: 'End_DateTime',
    VENUE: 'Venue',
    DESCRIPTION: 'Description',
    ALL_DAY: 'All_day',
    RELATED_TO: 'Related_To'
  },
  CALL: {
    SUBJECT: 'Subject',
    CALL_TYPE: 'Call_Type',
    CALL_START_TIME: 'Call_Start_Time',
    CALL_DURATION: 'Call_Duration',
    CALL_STATUS: 'Call_Status',
    DESCRIPTION: 'Description',
    RELATED_TO: 'Related_To'
  }
} as const;

// Helper function to build search criteria
export function buildSearchCriteria(searchField: string, searchValue: string, operator: string = 'equals'): string {
  const operatorMap: Record<string, string> = {
    'equals': '=',
    'contains': 'contains',
    'starts_with': 'starts_with',
    'ends_with': 'ends_with',
    'not_equals': '!='
  };
  
  const op = operatorMap[operator] || '=';
  return `(${searchField}:${op}:${searchValue})`;
}

// Helper function to format date for Bigin API
export function formatDateForBigin(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper function to format datetime for Bigin API
export function formatDateTimeForBigin(datetime: Date | string): string {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime);
  }
  return datetime.toISOString(); // ISO 8601 format
}

// Helper function to validate required fields
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

// Helper function to clean up data object (remove undefined/null values)
export function cleanupData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Helper function to extract error message from Bigin API response
export function extractErrorMessage(error: any): string {
  if (error.response?.body?.message) {
    return error.response.body.message;
  } else if (error.response?.body?.details?.message) {
    return error.response.body.details.message;
  } else if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Common dropdown for record selection
export function createRecordDropdown(moduleName: string, displayField: string = 'name') {
  return Property.Dropdown({
    displayName: `${moduleName} Record`,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: []
        };
      }

      try {
        const client = new BiginClient(auth);
        const response = await client.makeRequest(HttpMethod.GET, `/${MODULE_API_NAMES[moduleName as keyof typeof MODULE_API_NAMES]}`, {
          fields: 'id,' + displayField,
          per_page: '200'
        });

        const records = response.data || [];
        return {
          options: records.map((record: any) => ({
            label: record[displayField] || record.id,
            value: record.id
          }))
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load records',
          options: []
        };
      }
    }
  });
}
