import { httpClient, HttpMethod } from '@activepieces/pieces-common';

/**
 * Common utility functions for Copper CRM actions and triggers
 * This file contains shared functionality to reduce code duplication
 */

// ============================================================================
// HTTP Client Utilities
// ============================================================================

export interface CopperApiRequest {
  method: HttpMethod;
  url: string;
  auth: {
    apiKey: string;
    userEmail: string;
  };
  body?: any;
  queryParams?: Record<string, any>;
}

/**
 * Sends a request to the Copper API with proper authentication
 */
export async function sendCopperRequest(request: CopperApiRequest) {
  return await httpClient.sendRequest({
    method: request.method,
    url: request.url,
    headers: {
      'X-PW-AccessToken': request.auth.apiKey,
      'X-PW-Application': 'developer_api',
      'X-PW-UserEmail': request.auth.userEmail,
      'Content-Type': 'application/json',
    },
    body: request.body,
    queryParams: request.queryParams,
  });
}

/**
 * Handles common Copper API errors
 */
export function handleCopperError(error: any, operation: string): never {
  if (error.response?.status === 400) {
    throw new Error(`Bad request for ${operation}: ${JSON.stringify(error.response.body)}`);
  }
  if (error.response?.status === 401) {
    throw new Error(`Authentication failed for ${operation}. Please check your API key and user email.`);
  }
  if (error.response?.status === 403) {
    throw new Error(`Access forbidden for ${operation}. Please check your permissions.`);
  }
  if (error.response?.status === 404) {
    throw new Error(`Resource not found for ${operation}.`);
  }
  if (error.response?.status === 429) {
    throw new Error(`Rate limit exceeded for ${operation}. Please try again later.`);
  }
  throw new Error(`Error during ${operation}: ${error.message}`);
}

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * Converts a date string to Unix timestamp
 */
export function dateToUnixTimestamp(dateString: string): number {
  if (/^\d+$/.test(dateString)) {
    // Already a Unix timestamp
    return parseInt(dateString);
  }
  // Convert date string to Unix timestamp
  return Math.floor(new Date(dateString).getTime() / 1000);
}

/**
 * Formats a Unix timestamp to ISO date string
 */
export function unixTimestampToDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

/**
 * Builds contact information object for Copper API
 */
export function buildContactInfo(email?: string, emailCategory?: string, phoneNumber?: string, phoneCategory?: string) {
  const contactInfo: any = {};

  if (email) {
    contactInfo.emails = [{
      email: email,
      category: emailCategory || 'work'
    }];
  }

  if (phoneNumber) {
    contactInfo.phone_numbers = [{
      number: phoneNumber,
      category: phoneCategory || 'mobile'
    }];
  }

  return contactInfo;
}

/**
 * Builds address object for Copper API
 */
export function buildAddress(street?: string, city?: string, state?: string, postalCode?: string, country?: string) {
  const address: any = {};

  if (street) address.street = street;
  if (city) address.city = city;
  if (state) address.state = state;
  if (postalCode) address.postal_code = postalCode;
  if (country) address.country = country;

  return Object.keys(address).length > 0 ? address : undefined;
}

/**
 * Builds custom fields object for Copper API
 */
export function buildCustomFields(
  customField1Id?: number, customField1Value?: string,
  customField2Id?: number, customField2Value?: string,
  customField3Id?: number, customField3Value?: string
) {
  const customFields: any[] = [];

  if (customField1Id && customField1Value !== undefined) {
    customFields.push({
      custom_field_definition_id: customField1Id,
      value: customField1Value
    });
  }

  if (customField2Id && customField2Value !== undefined) {
    customFields.push({
      custom_field_definition_id: customField2Id,
      value: customField2Value
    });
  }

  if (customField3Id && customField3Value !== undefined) {
    customFields.push({
      custom_field_definition_id: customField3Id,
      value: customField3Value
    });
  }

  return customFields.length > 0 ? customFields : undefined;
}

// ============================================================================
// Webhook Utilities
// ============================================================================

/**
 * Creates a webhook subscription in Copper
 */
export async function createWebhookSubscription(
  auth: { apiKey: string; userEmail: string },
  webhookUrl: string,
  type: string,
  event: string,
  triggerName: string
) {
  const webhookData = {
    target: webhookUrl,
    type: type,
    event: event,
    secret: {
      source: 'activepieces',
      trigger: triggerName
    }
  };

  try {
    const response = await sendCopperRequest({
      method: HttpMethod.POST,
      url: 'https://api.copper.com/developer_api/v1/webhooks',
      auth,
      body: webhookData,
    });

    if (response.status === 200) {
      return response.body;
    } else {
      throw new Error(`Failed to create webhook: ${response.status}`);
    }
  } catch (error: any) {
    handleCopperError(error, 'webhook creation');
  }
}

/**
 * Deletes a webhook subscription in Copper
 */
export async function deleteWebhookSubscription(
  auth: { apiKey: string; userEmail: string },
  webhookId: string | number
) {
  try {
    await sendCopperRequest({
      method: HttpMethod.DELETE,
      url: `https://api.copper.com/developer_api/v1/webhooks/${webhookId}`,
      auth,
    });
  } catch (error: any) {
    // Don't throw error on cleanup failure, just log it
    console.error('Error deleting webhook:', error);
  }
}

// ============================================================================
// Search Utilities
// ============================================================================

/**
 * Builds search request body for Copper API
 */
export function buildSearchRequestBody(searchParams: Record<string, any>) {
  const requestBody: any = {};

  // Handle pagination
  if (searchParams['pageNumber']) {
    requestBody.page_number = searchParams['pageNumber'];
  }
  if (searchParams['pageSize']) {
    requestBody.page_size = Math.min(searchParams['pageSize'], 200); // Cap at 200
  }

  // Handle sorting
  if (searchParams['sortBy']) {
    requestBody.sort_by = searchParams['sortBy'];
  }

  // Handle date ranges
  if (searchParams['dateCreatedStart']) {
    requestBody.date_created_start = dateToUnixTimestamp(searchParams['dateCreatedStart']);
  }
  if (searchParams['dateCreatedEnd']) {
    requestBody.date_created_end = dateToUnixTimestamp(searchParams['dateCreatedEnd']);
  }
  if (searchParams['dateModifiedStart']) {
    requestBody.date_modified_start = dateToUnixTimestamp(searchParams['dateModifiedStart']);
  }
  if (searchParams['dateModifiedEnd']) {
    requestBody.date_modified_end = dateToUnixTimestamp(searchParams['dateModifiedEnd']);
  }
  if (searchParams['dateLastContactedStart']) {
    requestBody.date_last_contacted_start = dateToUnixTimestamp(searchParams['dateLastContactedStart']);
  }
  if (searchParams['dateLastContactedEnd']) {
    requestBody.date_last_contacted_end = dateToUnixTimestamp(searchParams['dateLastContactedEnd']);
  }

  // Handle monetary value ranges
  if (searchParams['monetaryValueMin'] !== undefined) {
    requestBody.monetary_value_min = searchParams['monetaryValueMin'];
  }
  if (searchParams['monetaryValueMax'] !== undefined) {
    requestBody.monetary_value_max = searchParams['monetaryValueMax'];
  }

  // Handle interaction count ranges
  if (searchParams['interactionCountMin'] !== undefined) {
    requestBody.interaction_count_min = searchParams['interactionCountMin'];
  }
  if (searchParams['interactionCountMax'] !== undefined) {
    requestBody.interaction_count_max = searchParams['interactionCountMax'];
  }

  // Handle boolean fields
  if (searchParams['followed'] !== undefined) {
    requestBody.followed = searchParams['followed'];
  }

  // Handle arrays
  if (searchParams['tags'] && Array.isArray(searchParams['tags'])) {
    requestBody.tags = searchParams['tags'];
  }
  if (searchParams['socials'] && Array.isArray(searchParams['socials'])) {
    requestBody.socials = searchParams['socials'];
  }

  // Handle custom fields
  if (searchParams['customField1Id']) {
    requestBody.custom_field_1 = {
      id: searchParams['customField1Id'],
      value: searchParams['customField1Value'],
      min_value: searchParams['customField1MinValue'],
      max_value: searchParams['customField1MaxValue'],
      allow_empty: searchParams['customField1AllowEmpty'],
      option: searchParams['customField1Option']
    };
  }

  if (searchParams['customField2Id']) {
    requestBody.custom_field_2 = {
      id: searchParams['customField2Id'],
      value: searchParams['customField2Value'],
      min_value: searchParams['customField2MinValue'],
      max_value: searchParams['customField2MaxValue'],
      allow_empty: searchParams['customField2AllowEmpty'],
      option: searchParams['customField2Option']
    };
  }

  if (searchParams['customField3Id']) {
    requestBody.custom_field_3 = {
      id: searchParams['customField3Id'],
      value: searchParams['customField3Value'],
      min_value: searchParams['customField3MinValue'],
      max_value: searchParams['customField3MaxValue'],
      allow_empty: searchParams['customField3AllowEmpty'],
      option: searchParams['customField3Option']
    };
  }

  return requestBody;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates that required fields are present
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (basic validation)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phoneNumber.replace(/[\s\-()]/g, ''));
}

// ============================================================================
// Constants
// ============================================================================

export const COPPER_API_BASE_URL = 'https://api.copper.com/developer_api/v1';

export const COPPER_ENTITY_TYPES = {
  PERSON: 'person',
  LEAD: 'lead',
  COMPANY: 'company',
  OPPORTUNITY: 'opportunity',
  PROJECT: 'project',
  TASK: 'task',
  ACTIVITY: 'activity_log'
} as const;

export const COPPER_EVENTS = {
  NEW: 'new',
  UPDATE: 'update',
  DELETE: 'delete'
} as const;

export const COPPER_EMAIL_CATEGORIES = {
  WORK: 'work',
  PERSONAL: 'personal',
  OTHER: 'other'
} as const;

export const COPPER_PHONE_CATEGORIES = {
  MOBILE: 'mobile',
  WORK: 'work',
  HOME: 'home',
  OTHER: 'other'
} as const;

export const COPPER_ACTIVITY_CATEGORIES = {
  USER: 'user',
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  TASK: 'task'
} as const;

export const COPPER_PRIORITIES = {
  NONE: 'None',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
} as const;
