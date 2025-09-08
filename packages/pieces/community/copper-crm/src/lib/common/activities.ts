import { Property } from '@activepieces/pieces-framework';

export const activityId = Property.ShortText({
  displayName: 'Activity ID',
  description: 'Unique identifier for the Activity.',
  required: false,
});

export const activityTypeCategory = Property.StaticDropdown({
  displayName: 'Activity Type Category',
  description: 'The category of the Activity Type. "user" for user-entered activities (e.g., Notes, Phone Calls), "system" for system-generated activities.',
  required: true,
  options: {
    options: [
      { label: 'User', value: 'user' },
      { label: 'System', value: 'system' },
    ],
  },
});

export const activityParentId = Property.Number({
  displayName: 'Parent Resource ID',
  description: 'The ID of the resource (Person, Lead, Company, etc.) this Activity belongs to.',
  required: true,
});

export const activityDetails = Property.LongText({
  displayName: 'Details',
  description: 'The text body or description of this Activity.',
  required: true,
});

export const activityUserId = Property.ShortText({
  displayName: 'User ID',
  description: 'The ID of the User who performed this Activity, if applicable.',
  required: false,
});

export const activityDate = Property.DateTime({
  displayName: 'Activity Date',
  description: 'The date and time when this Activity took place. (Will be converted to Unix timestamp).',
  required: false,
});

export const activityOldValue = Property.Json({
  displayName: 'Old Value (JSON)',
  description: 'When applicable, the value of a resource\'s property before this Activity took place, as a JSON object.',
  required: false,
});

export const activityNewValue = Property.Json({
  displayName: 'New Value (JSON)',
  description: 'When applicable, the value of a resource\'s property after this Activity took place, as a JSON object.',
  required: false,
});