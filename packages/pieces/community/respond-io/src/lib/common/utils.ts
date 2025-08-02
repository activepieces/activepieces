import { Property } from '@activepieces/pieces-framework';

// Common field definitions
export const COMMON_FIELDS = {
  CONTACT: {
    PHONE: 'phone',
    EMAIL: 'email',
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    FULL_NAME: 'fullName',
    LANGUAGE: 'language',
    TIMEZONE: 'timezone',
    CUSTOM_FIELDS: 'customFields'
  },
  CONVERSATION: {
    ID: 'id',
    CONTACT_ID: 'contactId',
    CHANNEL_ID: 'channelId',
    STATUS: 'status',
    ASSIGNEE_ID: 'assigneeId',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt'
  },
  MESSAGE: {
    ID: 'id',
    CONVERSATION_ID: 'conversationId',
    CONTENT: 'content',
    TYPE: 'type',
    DIRECTION: 'direction',
    CREATED_AT: 'createdAt'
  }
};

// Common property definitions
export const contactIdProperty = Property.ShortText({
  displayName: 'Contact ID',
  description: 'The unique identifier of the contact',
  required: true
});

export const conversationIdProperty = Property.ShortText({
  displayName: 'Conversation ID',
  description: 'The unique identifier of the conversation',
  required: true
});

export const phoneProperty = Property.ShortText({
  displayName: 'Phone Number',
  description: 'Phone number in international format (e.g., +1234567890)',
  required: false
});

export const emailProperty = Property.ShortText({
  displayName: 'Email',
  description: 'Email address of the contact',
  required: false
});

export const firstNameProperty = Property.ShortText({
  displayName: 'First Name',
  description: 'First name of the contact',
  required: false
});

export const lastNameProperty = Property.ShortText({
  displayName: 'Last Name',
  description: 'Last name of the contact',
  required: false
});

export const fullNameProperty = Property.ShortText({
  displayName: 'Full Name',
  description: 'Full name of the contact',
  required: false
});

export const languageProperty = Property.ShortText({
  displayName: 'Language',
  description: 'Language code (e.g., en, es, fr)',
  required: false
});

export const timezoneProperty = Property.ShortText({
  displayName: 'Timezone',
  description: 'Timezone (e.g., America/New_York)',
  required: false
});

export const tagNameProperty = Property.ShortText({
  displayName: 'Tag Name',
  description: 'Name of the tag to add',
  required: true
});

export const assigneeIdProperty = Property.ShortText({
  displayName: 'Assignee ID',
  description: 'ID of the user to assign the conversation to',
  required: false
});

export const commentProperty = Property.LongText({
  displayName: 'Comment',
  description: 'Internal comment to add to the conversation',
  required: true
});

// Utility functions
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function cleanupData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic validation for international phone numbers
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}
