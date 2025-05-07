import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { QuickbooksAuthType } from '../auth';

// API URLs
const QUICKBOOKS_API_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const QUICKBOOKS_API_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';
const API_VERSION = '65'; // Using a stable API version

// Common interface for API responses
export interface QuickbooksEntityResponse<T> {
  QueryResponse?: {
    startPosition?: number;
    maxResults?: number;
    totalCount?: number;
    [key: string]: T[] | number | undefined;
  };
  Fault?: {
    Error: {
      Message: string;
      Detail?: string;
      code: string;
    }[];
    type: string;
  };
  time?: string;
}

export const quickbooksCommon = {
  // Get the appropriate API URL based on environment
  getApiUrl: (auth: OAuth2PropertyValue) => {
    if (!auth.props) {
      throw new Error('Missing auth props');
    }

    const environment = auth.props['environment'] as string;
    const realmId = auth.props['realmId'] as string;

    if (!environment || !realmId) {
      throw new Error('Missing required properties: environment or realmId');
    }

    const baseUrl = environment === 'sandbox'
      ? QUICKBOOKS_API_URL_SANDBOX
      : QUICKBOOKS_API_URL_PRODUCTION;
    return `${baseUrl}/${realmId}`;
  },

  // Common properties for actions
  invoiceIdProperty: Property.ShortText({
    displayName: 'Invoice ID',
    description: 'The ID of the invoice',
    required: true,
  }),

  customerIdProperty: Property.ShortText({
    displayName: 'Customer ID',
    description: 'The ID of the customer',
    required: true,
  }),

  paymentIdProperty: Property.ShortText({
    displayName: 'Payment ID',
    description: 'The ID of the payment',
    required: true,
  }),

  expenseIdProperty: Property.ShortText({
    displayName: 'Expense ID',
    description: 'The ID of the expense',
    required: true,
  }),

  estimateIdProperty: Property.ShortText({
    displayName: 'Estimate ID',
    description: 'The ID of the estimate',
    required: true,
  }),

  // Helper method to make API requests
  async makeRequest<T>({
    auth,
    method,
    path,
    query = {},
    body,
  }: {
    auth: OAuth2PropertyValue;
    method: HttpMethod;
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }): Promise<T> {
    const apiUrl = quickbooksCommon.getApiUrl(auth);
    const url = `${apiUrl}/${path}`;

    // Add API version to all requests
    const queryParams = {
      ...query,
      minorversion: API_VERSION,
    };

    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        queryParams,
        body,
      });

      return response.body;
    } catch (error) {
      console.error(`QuickBooks API Error [${method} ${path}]:`, error);
      throw error;
    }
  },

  // Helper to build a query string for the QuickBooks Query API
  buildQuery: (entity: string, conditions: string[] = [], orderBy?: string, maxResults: number = 1000) => {
    let query = `SELECT * FROM ${entity}`;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    query += ` MAXRESULTS ${maxResults}`;

    return query;
  },
};
